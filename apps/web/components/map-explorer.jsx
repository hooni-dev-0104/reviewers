'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { formatDeadline, formatRegion, formatSourceName, formatText, getInternalMapLaunchUrl } from '@/lib/format';

const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const DEFAULT_CENTER = [37.5665, 126.978];
const CLUSTER_CELL_SIZE = 64;

export function MapExplorer({ campaigns = [] }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const leafletLibRef = useRef(null);
  const markerLayerRef = useRef(null);

  const [selectedId, setSelectedId] = useState(campaigns[0]?.id || null);
  const [visibleIds, setVisibleIds] = useState(() => campaigns.map((campaign) => campaign.id));

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedId) || campaigns[0] || null,
    [campaigns, selectedId]
  );

  const visibleCampaigns = useMemo(() => {
    const visibleSet = new Set(visibleIds);
    const filtered = campaigns.filter((campaign) => visibleSet.has(campaign.id));
    return filtered.length ? filtered : campaigns;
  }, [campaigns, visibleIds]);

  useEffect(() => {
    let cancelled = false;

    async function bootMap() {
      if (!campaigns.length || !mapRef.current) {
        return;
      }

      const L = await loadLeaflet();
      if (cancelled || !mapRef.current || leafletRef.current) {
        return;
      }

      leafletLibRef.current = L;
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView(DEFAULT_CENTER, 7);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      markerLayerRef.current = L.layerGroup().addTo(map);
      leafletRef.current = map;

      const bounds = L.latLngBounds(campaigns.map((campaign) => [campaign.latitude, campaign.longitude]));
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.08), { maxZoom: 13 });
      }

      map.on('moveend zoomend', () => {
        updateVisibleIds(map, campaigns, setVisibleIds);
        renderMarkers({ map, L, campaigns, selectedId, setSelectedId, layer: markerLayerRef.current });
      });

      updateVisibleIds(map, campaigns, setVisibleIds);
      renderMarkers({ map, L, campaigns, selectedId, setSelectedId, layer: markerLayerRef.current });
    }

    bootMap();

    return () => {
      cancelled = true;
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        markerLayerRef.current = null;
      }
    };
  }, [campaigns]);

  useEffect(() => {
    const map = leafletRef.current;
    const L = leafletLibRef.current;
    const layer = markerLayerRef.current;
    if (!map || !L || !layer) {
      return;
    }

    if (selectedCampaign) {
      map.panTo([selectedCampaign.latitude, selectedCampaign.longitude], { animate: true });
    }
    renderMarkers({ map, L, campaigns, selectedId, setSelectedId, layer });
  }, [campaigns, selectedCampaign, selectedId]);

  if (!campaigns.length) {
    return (
      <section className="map-empty-state">
        <h2>지도로 볼 수 있는 체험단이 아직 없어요</h2>
        <p>정확한 위치가 확인된 방문형 캠페인부터 이 탭에 보여드릴게요.</p>
      </section>
    );
  }

  const kakaoUrl = selectedCampaign ? getInternalMapLaunchUrl(selectedCampaign, 'kakao') : null;

  return (
    <section className="map-layout">
      <div className="map-canvas-panel">
        {selectedCampaign ? (
            <div className="map-canvas-head">
              <div>
                <span className="eyebrow">선택한 장소</span>
                <h2>{formatText(selectedCampaign.title)}</h2>
                <p>{selectedCampaign.exact_location}</p>
              </div>
              <div className="detail-map-links">
                <a href={kakaoUrl} target="_blank" rel="noreferrer">카카오맵</a>
              </div>
            </div>
        ) : null}

        <div ref={mapRef} className="map-surface" />
      </div>

      <div className="map-list-panel">
        <div className="map-list-head">
          <div>
            <span className="eyebrow">현재 지도 안 캠페인</span>
            <strong>{visibleCampaigns.length}개</strong>
          </div>
          <span className="map-count-pill">전체 {campaigns.length}개</span>
        </div>

        <div className="map-card-list">
          {visibleCampaigns.map((campaign) => (
            <article
              key={campaign.id}
              className={`map-list-card ${selectedCampaign?.id === campaign.id ? 'active' : ''}`}
            >
              <button
                type="button"
                className="map-list-select"
                onClick={() => setSelectedId(campaign.id)}
              >
                <span className="source-chip">{formatSourceName(campaign.sources)}</span>
                <h3>{formatText(campaign.title)}</h3>
                <p>{campaign.exact_location}</p>
                <small>{formatRegion(campaign)} · {formatDeadline(campaign.apply_deadline)}</small>
              </button>
              <Link href={`/campaign/${campaign.id}`}>
                상세 보기
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function updateVisibleIds(map, campaigns, setVisibleIds) {
  const bounds = map.getBounds();
  const ids = campaigns
    .filter((campaign) => bounds.contains([campaign.latitude, campaign.longitude]))
    .map((campaign) => campaign.id);
  setVisibleIds(ids);
}

function renderMarkers({ map, L, campaigns, selectedId, setSelectedId, layer }) {
  if (!map || !L || !layer) {
    return;
  }

  layer.clearLayers();
  const clusters = clusterCampaigns(map, campaigns);

  for (const cluster of clusters) {
    if (cluster.campaigns.length === 1) {
      const campaign = cluster.campaigns[0];
      const marker = L.marker([campaign.latitude, campaign.longitude], {
        icon: L.divIcon({
          className: 'map-pin-wrapper',
          html: `<div class="map-pin ${campaign.id === selectedId ? 'active' : ''}"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        })
      });

      marker.on('click', () => setSelectedId(campaign.id));
      layer.addLayer(marker);
      continue;
    }

    const marker = L.marker([cluster.latitude, cluster.longitude], {
      icon: L.divIcon({
        className: 'map-cluster-wrapper',
        html: `<div class="map-cluster">${cluster.campaigns.length}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      })
    });

    marker.on('click', () => {
      const bounds = L.latLngBounds(cluster.campaigns.map((campaign) => [campaign.latitude, campaign.longitude]));
      map.fitBounds(bounds.pad(0.25), { maxZoom: Math.max(map.getZoom() + 1, 13) });
    });

    layer.addLayer(marker);
  }
}

function clusterCampaigns(map, campaigns) {
  const buckets = new Map();

  for (const campaign of campaigns) {
    const point = map.project([campaign.latitude, campaign.longitude], map.getZoom());
    const key = `${Math.floor(point.x / CLUSTER_CELL_SIZE)}:${Math.floor(point.y / CLUSTER_CELL_SIZE)}`;
    const bucket = buckets.get(key) || { campaigns: [], x: 0, y: 0 };
    bucket.campaigns.push(campaign);
    bucket.x += campaign.longitude;
    bucket.y += campaign.latitude;
    buckets.set(key, bucket);
  }

  return [...buckets.values()].map((bucket) => ({
    campaigns: bucket.campaigns,
    latitude: bucket.y / bucket.campaigns.length,
    longitude: bucket.x / bucket.campaigns.length
  }));
}

async function loadLeaflet() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (window.L) {
    return window.L;
  }

  await ensureStylesheet(LEAFLET_CSS_URL, 'reviewkok-leaflet-css');
  await ensureScript(LEAFLET_JS_URL, 'reviewkok-leaflet-js');
  return window.L;
}

function ensureStylesheet(href, id) {
  return new Promise((resolve) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    document.head.appendChild(link);
  });
}

function ensureScript(src, id) {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id) && window.L) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
