'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

import { formatDeadline, formatRegion, formatSourceName, formatText, getInternalMapLaunchUrl } from '@/lib/format';

const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const KAKAO_SDK_URL = 'https://dapi.kakao.com/v2/maps/sdk.js';
const KAKAO_MAP_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
const VWORLD_API_KEY = process.env.NEXT_PUBLIC_VWORLD_API_KEY;
const DEFAULT_CENTER = [37.5665, 126.978];
const KAKAO_MAX_AUTO_ZOOM_LEVEL = 6;
const KAKAO_CLUSTER_MIN_LEVEL = 8;
const VWORLD_MIN_ZOOM_LEVEL = 6;

export function MapExplorer({ campaigns = [] }) {
  const mapContainerRef = useRef(null);
  const mapStateRef = useRef(null);

  const [selectedId, setSelectedId] = useState(null);
  const [visibleIds, setVisibleIds] = useState(() => campaigns.map((campaign) => campaign.id));

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === selectedId) || null,
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
      if (!campaigns.length || !mapContainerRef.current) {
        return;
      }

      const state = await createMapState(mapContainerRef.current, campaigns);
      if (cancelled || !state || !mapContainerRef.current || mapStateRef.current) {
        return;
      }

      mapStateRef.current = state;
      attachViewportListener(state, campaigns, setVisibleIds);
      updateVisibleIdsForState(state, campaigns, setVisibleIds);
      renderMarkersForState(state, campaigns, selectedId, setSelectedId);
    }

    bootMap();

    return () => {
      cancelled = true;
      if (mapStateRef.current) {
        destroyMapState(mapStateRef.current);
        mapStateRef.current = null;
      }
    };
  }, [campaigns]);

  useEffect(() => {
    const state = mapStateRef.current;
    if (!state) {
      return;
    }

    if (selectedCampaign) {
      focusCampaignOnMap(state, selectedCampaign);
    }
    renderMarkersForState(state, campaigns, selectedId, setSelectedId);
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
        <div className="map-canvas-head">
          <div>
            <span className="eyebrow">{selectedCampaign ? '선택한 장소' : '지도 둘러보기'}</span>
            <h2>{selectedCampaign ? formatText(selectedCampaign.title) : '캠페인을 눌러 상세 위치를 확인해보세요'}</h2>
            {selectedCampaign ? <p>{selectedCampaign.exact_location}</p> : null}
          </div>
          {selectedCampaign ? (
            <div className="detail-map-links">
              <a href={kakaoUrl} target="_blank" rel="noreferrer">카카오맵</a>
            </div>
          ) : null}
        </div>

        <div ref={mapContainerRef} className="map-surface" />
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

async function createMapState(container, campaigns) {
  const vworld = await loadVWorldRuntime();
  if (vworld?.vw?.ol3?.Map && vworld?.ol) {
    return createVWorldMapState(container, vworld, campaigns);
  }

  try {
    const kakao = await loadKakaoMap();
    if (kakao?.maps) {
      return createKakaoMapState(container, kakao, campaigns);
    }
  } catch (error) {
    console.error('Kakao map bootstrap failed, falling back to Leaflet.', error);
  }

  const L = await loadLeaflet();
  if (!L) {
    return null;
  }

  return createLeafletMapState(container, L, campaigns);
}

async function loadVWorldRuntime(timeoutMs = 2000) {
  if (typeof window === 'undefined' || !VWORLD_API_KEY) {
    return null;
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (window.vw?.ol3?.Map && window.ol) {
      return {
        vw: window.vw,
        ol: window.ol
      };
    }
    await new Promise((resolve) => window.setTimeout(resolve, 40));
  }

  return null;
}

function createVWorldMapState(container, runtime, campaigns) {
  const { vw, ol } = runtime;
  const mapId = container.id || `reviewkok-vworld-map-${Math.random().toString(36).slice(2, 10)}`;
  container.id = mapId;
  container.innerHTML = '';

  const map = new vw.ol3.Map(mapId, {
    basemapType: vw.ol3.BasemapType.GRAPHIC,
    controlDensity: vw.ol3.DensityType?.BASIC,
    interactionDensity: vw.ol3.DensityType?.BASIC
  });

  map.updateSize?.();

  const vectorSource = new ol.source.Vector({ wrapX: false });
  const vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: (feature) => createVWorldMarkerStyle(ol, feature.get('selected'))
  });
  map.addLayer(vectorLayer);

  fitVWorldBounds(map, ol, campaigns);

  return {
    engine: 'vworld',
    container,
    map,
    lib: vw,
    ol,
    vectorSource,
    vectorLayer,
    viewportCleanup: null,
    clickCleanup: null
  };
}

function createLeafletMapState(container, L, campaigns) {
  const map = L.map(container, {
    zoomControl: true,
    attributionControl: true
  }).setView(DEFAULT_CENTER, 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  const layer = L.layerGroup().addTo(map);
  const bounds = L.latLngBounds(campaigns.map((campaign) => [campaign.latitude, campaign.longitude]));
  if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.08), { maxZoom: 11 });
  }

  return {
    engine: 'leaflet',
    container,
    map,
    lib: L,
    layer,
    viewportCleanup: null
  };
}

function createKakaoMapState(container, kakao, campaigns) {
  const map = new kakao.maps.Map(container, {
    center: new kakao.maps.LatLng(DEFAULT_CENTER[0], DEFAULT_CENTER[1]),
    level: 13
  });

  map.addControl(new kakao.maps.MapTypeControl(), kakao.maps.ControlPosition.TOPRIGHT);
  map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
  relayoutKakaoMap(map, kakao, campaigns);

  return {
    engine: 'kakao',
    container,
    map,
    lib: kakao,
    clusterer: new kakao.maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: KAKAO_CLUSTER_MIN_LEVEL,
      disableClickZoom: true
    }),
    markers: [],
    viewportCleanup: null
  };
}

function attachViewportListener(state, campaigns, setVisibleIds) {
  if (state.engine === 'vworld') {
    const moveKey = state.map.on('moveend', () => updateVisibleIdsForState(state, campaigns, setVisibleIds));
    state.viewportCleanup = () => state.ol.Observable.unByKey(moveKey);
    return;
  }

  if (state.engine === 'kakao') {
    const handler = () => updateVisibleIdsForState(state, campaigns, setVisibleIds);
    state.lib.maps.event.addListener(state.map, 'idle', handler);
    state.viewportCleanup = () => state.lib.maps.event.removeListener(state.map, 'idle', handler);
    return;
  }

  const handler = () => updateVisibleIdsForState(state, campaigns, setVisibleIds);
  state.map.on('moveend zoomend', handler);
  state.viewportCleanup = () => state.map.off('moveend zoomend', handler);
}

function destroyMapState(state) {
  if (!state) {
    return;
  }

  state.viewportCleanup?.();

  if (state.engine === 'kakao') {
    state.clusterer?.clear();
    state.markers?.forEach((marker) => marker.setMap(null));
    if (state.container) {
      state.container.innerHTML = '';
    }
    return;
  }

  if (state.engine === 'vworld') {
    state.clickCleanup?.();
    state.map?.removeLayer(state.vectorLayer);
    state.vectorSource?.clear();
    state.map?.setTarget?.(null);
    if (state.container) {
      state.container.innerHTML = '';
    }
    return;
  }

  state.map?.remove();
}

function updateVisibleIdsForState(state, campaigns, setVisibleIds) {
  if (state.engine === 'vworld') {
    const extent = state.map.getView().calculateExtent(state.map.getSize());
    const ids = campaigns
      .filter((campaign) => state.ol.extent.containsCoordinate(extent, toVWorldCoordinate(state.ol, campaign)))
      .map((campaign) => campaign.id);
    setVisibleIds(ids);
    return;
  }

  if (state.engine === 'kakao') {
    const bounds = state.map.getBounds();
    const ids = campaigns
      .filter((campaign) => bounds.contain(new state.lib.maps.LatLng(campaign.latitude, campaign.longitude)))
      .map((campaign) => campaign.id);
    setVisibleIds(ids);
    return;
  }

  const bounds = state.map.getBounds();
  const ids = campaigns
    .filter((campaign) => bounds.contains([campaign.latitude, campaign.longitude]))
    .map((campaign) => campaign.id);
  setVisibleIds(ids);
}

function renderMarkersForState(state, campaigns, selectedId, setSelectedId) {
  if (state.engine === 'vworld') {
    renderVWorldMarkers(state, campaigns, selectedId, setSelectedId);
    return;
  }

  if (state.engine === 'kakao') {
    renderKakaoMarkers(state, campaigns, selectedId, setSelectedId);
    return;
  }

  renderLeafletMarkers(state, campaigns, selectedId, setSelectedId);
}

function renderVWorldMarkers(state, campaigns, selectedId, setSelectedId) {
  const { map, ol, vectorSource } = state;
  if (!map || !ol || !vectorSource) {
    return;
  }

  vectorSource.clear();
  vectorSource.addFeatures(
    campaigns.map((campaign) => {
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(toVWorldCoordinate(ol, campaign)),
        campaignId: campaign.id,
        selected: campaign.id === selectedId
      });
      return feature;
    })
  );

  if (!state.clickCleanup) {
    const clickKey = map.on('singleclick', (event) => {
      let found = null;
      map.forEachFeatureAtPixel(event.pixel, (feature) => {
        found = feature;
        return true;
      });
      if (found) {
        setSelectedId(found.get('campaignId'));
      }
    });

    state.clickCleanup = () => ol.Observable.unByKey(clickKey);
  }
}

function renderLeafletMarkers(state, campaigns, selectedId, setSelectedId) {
  const { map, lib: L, layer } = state;
  if (!map || !L || !layer) {
    return;
  }

  layer.clearLayers();

  for (const campaign of campaigns) {
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
  }
}

function renderKakaoMarkers(state, campaigns, selectedId, setSelectedId) {
  const { lib: kakao, clusterer } = state;
  if (!kakao?.maps || !clusterer) {
    return;
  }

  clusterer.clear();
  state.markers.forEach((marker) => marker.setMap(null));

  state.markers = campaigns.map((campaign) => {
    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(campaign.latitude, campaign.longitude),
      title: formatText(campaign.title),
      clickable: true,
      zIndex: campaign.id === selectedId ? 10 : 1
    });

    kakao.maps.event.addListener(marker, 'click', () => setSelectedId(campaign.id));
    return marker;
  });

  clusterer.addMarkers(state.markers);
}

function focusCampaignOnMap(state, selectedCampaign) {
  if (!selectedCampaign) {
    return;
  }

  if (state.engine === 'vworld') {
    state.map.getView().animate({
      center: toVWorldCoordinate(state.ol, selectedCampaign),
      duration: 240
    });
    return;
  }

  if (state.engine === 'kakao') {
    state.map.panTo(new state.lib.maps.LatLng(selectedCampaign.latitude, selectedCampaign.longitude));
    return;
  }

  state.map.panTo([selectedCampaign.latitude, selectedCampaign.longitude], { animate: true });
}

function fitKakaoBounds(map, kakao, campaigns) {
  const bounds = new kakao.maps.LatLngBounds();

  for (const campaign of campaigns) {
    bounds.extend(new kakao.maps.LatLng(campaign.latitude, campaign.longitude));
  }

  if (!bounds.isEmpty()) {
    map.setBounds(bounds, 64, 64, 64, 64);
    if (map.getLevel() < KAKAO_MAX_AUTO_ZOOM_LEVEL) {
      map.setLevel(KAKAO_MAX_AUTO_ZOOM_LEVEL);
    }
  }
}

function fitVWorldBounds(map, ol, campaigns) {
  if (!campaigns.length) {
    return;
  }

  const extent = ol.extent.createEmpty();
  for (const campaign of campaigns) {
    const [x, y] = toVWorldCoordinate(ol, campaign);
    ol.extent.extend(extent, [x, y, x, y]);
  }

  map.updateSize?.();
  map.getView().fit(extent, {
    padding: [40, 40, 40, 40],
    maxZoom: 11,
    duration: 0
  });
  if (map.getView().getZoom() < VWORLD_MIN_ZOOM_LEVEL) {
    map.getView().setZoom(VWORLD_MIN_ZOOM_LEVEL);
  }
}

function toVWorldCoordinate(ol, campaign) {
  return ol.proj.transform([campaign.longitude, campaign.latitude], 'EPSG:4326', 'EPSG:900913');
}

function createVWorldMarkerStyle(ol, selected) {
  return new ol.style.Style({
    image: new ol.style.Circle({
      radius: selected ? 10 : 8,
      fill: new ol.style.Fill({
        color: selected ? '#8b5cf6' : '#ff7a00'
      }),
      stroke: new ol.style.Stroke({
        color: '#ffffff',
        width: 3
      })
    })
  });
}

function relayoutKakaoMap(map, kakao, campaigns) {
  const rerender = () => {
    map.relayout();
    fitKakaoBounds(map, kakao, campaigns);
  };

  rerender();
  if (typeof window !== 'undefined') {
    window.requestAnimationFrame(rerender);
    window.setTimeout(rerender, 120);
    window.setTimeout(rerender, 500);
    window.setTimeout(rerender, 1200);
  }
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

async function loadKakaoMap() {
  if (typeof window === 'undefined' || !KAKAO_MAP_APP_KEY) {
    return null;
  }

  if (window.kakao?.maps) {
    await new Promise((resolve) => window.kakao.maps.load(resolve));
    return window.kakao;
  }

  const src = `${KAKAO_SDK_URL}?appkey=${encodeURIComponent(KAKAO_MAP_APP_KEY)}&autoload=false&libraries=clusterer`;
  await ensureScript(src, 'reviewkok-kakao-map-js');
  await new Promise((resolve) => window.kakao.maps.load(resolve));
  return window.kakao;
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
    const existing = document.getElementById(id);
    if (existing) {
      if (existing.dataset.loaded === 'true' || window.L || window.kakao?.maps) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
