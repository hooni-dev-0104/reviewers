part of '../../../main.dart';

class RkColor {
  const RkColor._();

  static const white = Color(0xFFFFFFFF);
  static const paper = Color(0xFFF7F6F3);
  static const paper2 = Color(0xFFF1EFEA);
  static const surface = Color(0xFFFFFFFF);
  static const sunken = Color(0xFFFAF9F6);
  static const line = Color(0xFFE7E4DD);
  static const lineStrong = Color(0xFFD8D4CB);
  static const ink900 = Color(0xFF1B1A17);
  static const ink700 = Color(0xFF36332D);
  static const ink500 = Color(0xFF6B665D);
  static const ink400 = Color(0xFF97928A);
  static const ink300 = Color(0xFFBCB8AF);

  static const primary = Color(0xFF2B5FE3);
  static const primaryHover = Color(0xFF2150CF);
  static const primaryActive = Color(0xFF1B45B4);
  static const primaryWeak = Color(0xFFEAF0FE);
  static const primaryWeak2 = Color(0xFFD9E4FD);
  static const primaryText = Color(0xFF1D49B8);

  static const danger = Color(0xFFDA3B33);
  static const dangerWeak = Color(0xFFFCEAE8);
  static const dangerText = Color(0xFFB42820);
  static const success = Color(0xFF138A5E);
  static const successWeak = Color(0xFFE2F3EA);
  static const successText = Color(0xFF0C6E49);
  static const warning = Color(0xFFB26C12);
  static const warningWeak = Color(0xFFFAEFD8);
  static const warningText = Color(0xFF8A5410);
  static const sponsorWeak = Color(0xFFF3ECDA);
  static const sponsorText = Color(0xFF7A5E1E);
  static const sponsorLine = Color(0xFFE4D6AE);
  static const rewardWeak = Color(0xFFFCF1E4);
  static const rewardText = Color(0xFF935A23);
  static const rewardLine = Color(0xFFF0DDC7);
}

class RkSpace {
  const RkSpace._();

  static const x1 = 4.0;
  static const x2 = 8.0;
  static const x3 = 12.0;
  static const x4 = 16.0;
  static const x5 = 24.0;
  static const x6 = 32.0;
}

class RkRadius {
  const RkRadius._();

  static const xs = 2.0;
  static const sm = 4.0;
  static const md = 6.0;
  static const lg = 8.0;
  static const pill = 999.0;
}

class RkTone {
  const RkTone({
    required this.background,
    required this.foreground,
    required this.border,
  });

  final Color background;
  final Color foreground;
  final Color border;

  static const urgent = RkTone(
    background: RkColor.dangerWeak,
    foreground: RkColor.dangerText,
    border: Color(0xFFF3CDC9),
  );
  static const trust = RkTone(
    background: RkColor.primaryWeak,
    foreground: RkColor.primaryText,
    border: Color(0xFFCDDCFC),
  );
  static const success = RkTone(
    background: RkColor.successWeak,
    foreground: RkColor.successText,
    border: Color(0xFFC4E7D3),
  );
  static const warning = RkTone(
    background: RkColor.warningWeak,
    foreground: RkColor.warningText,
    border: Color(0xFFECD8A8),
  );
  static const sponsor = RkTone(
    background: RkColor.sponsorWeak,
    foreground: RkColor.sponsorText,
    border: RkColor.sponsorLine,
  );
  static const reward = RkTone(
    background: RkColor.rewardWeak,
    foreground: RkColor.rewardText,
    border: RkColor.rewardLine,
  );
  static const neutral = RkTone(
    background: RkColor.paper2,
    foreground: RkColor.ink500,
    border: RkColor.line,
  );
}

BoxDecoration rkSurfaceDecoration({
  Color color = RkColor.surface,
  Color border = RkColor.line,
  double radius = RkRadius.lg,
  bool raised = false,
}) {
  return BoxDecoration(
    color: color,
    border: Border.all(color: border),
    borderRadius: BorderRadius.circular(radius),
    boxShadow: raised
        ? const [
            BoxShadow(
              color: Color(0x141B1A17),
              blurRadius: 12,
              offset: Offset(0, 4),
            ),
          ]
        : const [
            BoxShadow(
              color: Color(0x0F1B1A17),
              blurRadius: 2,
              offset: Offset(0, 1),
            ),
          ],
  );
}
