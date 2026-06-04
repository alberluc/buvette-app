/* ─── Shared email templates ─────────────────────────────────────────────────
   All CSS is inline; tables are used for multi-column layout (Outlook compat).
   Color tokens mirror the app/landing design system.
   ────────────────────────────────────────────────────────────────────────── */

function fmtEUR(n) {
  return (Math.round(n * 100) / 100).toFixed(2).replace('.', ',') + ' €'
}

function wrapper(preheader, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Assolyte</title>
</head>
<body style="margin:0;padding:0;background:#ECE3D2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!--[if mso]><table role="presentation" width="100%"><tr><td><![endif]-->

  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#ECE3D2;padding:32px 16px;min-width:320px;">
    <tr><td align="center">

      <!-- Inner card (max 560px) -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"
             style="width:100%;max-width:560px;">

        <!-- ── HEADER ────────────────────────────────────────────────── -->
        <tr>
          <td style="background:#1F6F3F;border-radius:14px 14px 0 0;padding:22px 36px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <!-- Logo mark -->
                <td style="width:32px;height:32px;vertical-align:middle;">
                  <img src="https://assolyte.fr/logo_transparent.png" width="32" height="32" alt="Assolyte" style="display:block;border:0;" />
                </td>
                <td style="padding-left:11px;vertical-align:middle;">
                  <span style="color:#fff;font-size:17px;font-weight:800;letter-spacing:-0.02em;">Assolyte</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── BODY ─────────────────────────────────────────────────── -->
        <tr>
          <td style="background:#FFFCF6;border:1px solid #E1D8C5;border-top:none;
                     border-radius:0 0 14px 14px;padding:36px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- ── FOOTER ────────────────────────────────────────────────── -->
        <tr>
          <td style="padding:22px 36px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9A9084;line-height:1.7;">
              Assolyte · La caisse pour les buvettes de clubs sportifs<br>
              Cet e-mail est automatique —
              <a href="mailto:bonjour@assolyte.fr" style="color:#9A9084;text-decoration:underline;">bonjour@assolyte.fr</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

  <!--[if mso]></td></tr></table><![endif]-->
</body>
</html>`
}

/* ─── Template 1 : accès démo ─────────────────────────────────────────────── */
export function demoEmailHtml({ key, daysCount, expiresLabel }) {
  const body = `
    <!-- Title -->
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#1F1B16;letter-spacing:-0.02em;">
      Votre accès démo
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#5C544A;line-height:1.65;">
      Bonjour,<br>
      Voici votre clé pour découvrir Assolyte — votre espace est déjà rempli avec
      <strong style="color:#1F1B16;">${daysCount}&nbsp;journées</strong> de données réalistes.
    </p>

    <!-- License key card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin-bottom:16px;">
      <tr>
        <td style="background:#F6F1E8;border:1.5px solid #E1D8C5;border-radius:12px;
                   padding:22px 24px;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.08em;
                    text-transform:uppercase;color:#9A9084;">
            Clé de licence
          </p>
          <p style="margin:0;font-size:26px;font-family:'Courier New',Courier,monospace;
                    font-weight:700;letter-spacing:6px;color:#1F1B16;">
            ${key}
          </p>
        </td>
      </tr>
    </table>

    <!-- Validity badge -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin-bottom:28px;">
      <tr>
        <td style="background:#E3EFE7;border-radius:10px;padding:13px 18px;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#1F6F3F;">
            ✓&nbsp; Validité 3 jours — expire le ${expiresLabel}
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin-bottom:20px;">
      <tr>
        <td align="center">
          <a href="https://app.assolyte.fr"
             style="display:inline-block;background:#1F6F3F;color:#ffffff;font-size:16px;
                    font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
                    text-decoration:none;padding:16px 36px;border-radius:12px;letter-spacing:-0.01em;">
            Ouvrir l'application →
          </a>
        </td>
      </tr>
    </table>

    <!-- Instructions -->
    <p style="margin:0;font-size:13px;color:#9A9084;text-align:center;line-height:1.6;">
      Saisissez votre clé sur l'écran d'activation pour accéder à votre espace de démo.
    </p>
  `

  return wrapper(
    `Votre clé d'accès pour découvrir Assolyte est prête — ${daysCount} journées de données incluses.`,
    body,
  )
}

/* ─── Template 2 : nouvelle licence ──────────────────────────────────────── */
export function licenseEmailHtml({ key, clubName, plan, expiresLabel }) {
  const planLabel = plan === 'annual' ? 'Annuel (365 jours)' : 'Mensuel (30 jours)'
  const body = `
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#1F1B16;letter-spacing:-0.02em;">
      Votre licence Assolyte
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#5C544A;line-height:1.65;">
      Bonjour,<br>
      Voici la clé de licence pour <strong style="color:#1F1B16;">${clubName}</strong>.
      Saisissez-la sur l'écran d'activation pour accéder à votre espace.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin-bottom:16px;">
      <tr>
        <td style="background:#F6F1E8;border:1.5px solid #E1D8C5;border-radius:12px;
                   padding:22px 24px;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.08em;
                    text-transform:uppercase;color:#9A9084;">
            Clé de licence
          </p>
          <p style="margin:0;font-size:26px;font-family:'Courier New',Courier,monospace;
                    font-weight:700;letter-spacing:6px;color:#1F1B16;">
            ${key}
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin-bottom:28px;">
      <tr>
        <td style="background:#E3EFE7;border-radius:10px;padding:13px 18px;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#1F6F3F;">
            ✓&nbsp; Plan ${planLabel}
          </p>
          <p style="margin:0;font-size:13px;color:#1F6F3F;">
            Expire le ${expiresLabel}
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin-bottom:20px;">
      <tr>
        <td align="center">
          <a href="https://app.assolyte.fr"
             style="display:inline-block;background:#1F6F3F;color:#ffffff;font-size:16px;
                    font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
                    text-decoration:none;padding:16px 36px;border-radius:12px;letter-spacing:-0.01em;">
            Ouvrir l'application →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#9A9084;text-align:center;line-height:1.6;">
      Conservez cet e-mail — votre clé sera nécessaire à chaque nouvelle installation.
    </p>
  `
  return wrapper(
    `Votre clé de licence Assolyte pour ${clubName} — plan ${planLabel}.`,
    body,
  )
}

/* ─── Template 3 : bilan mensuel (réel ou de test) ───────────────────────── */
export function reportEmailHtml({ clubName, label, data, isTest = false }) {
  const total   = fmtEUR(data.grandTotal)
  const especes = fmtEUR(data.grandEspeces)
  const carte   = fmtEUR(data.grandCarte)

  // Top products (up to 5, sorted by revenue)
  const topProducts = Object.values(data.grandProducts ?? {})
    .filter(p => p.qty > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const productRows = topProducts.map(p => `
    <tr>
      <td style="padding:9px 0;font-size:14px;color:#1F1B16;font-weight:600;
                 border-bottom:1px solid #F0EBE0;">
        ${p.name}
      </td>
      <td style="padding:9px 0;font-size:14px;color:#5C544A;text-align:right;
                 border-bottom:1px solid #F0EBE0;">
        ${p.qty}&nbsp;×
      </td>
      <td style="padding:9px 0;font-size:14px;color:#1F1B16;font-weight:700;
                 text-align:right;border-bottom:1px solid #F0EBE0;padding-left:16px;">
        ${fmtEUR(p.total)}
      </td>
    </tr>`).join('')

  const testBanner = isTest ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin-bottom:24px;">
      <tr>
        <td style="background:#F3E6CC;border:1px solid #D9AC6B;border-radius:10px;padding:12px 18px;">
          <p style="margin:0;font-size:13px;font-weight:700;color:#B47A1E;">
            ⚙️&nbsp; E-mail de test — données fictives
          </p>
        </td>
      </tr>
    </table>` : ''

  const productSection = topProducts.length > 0 ? `
    <!-- Products breakdown -->
    <p style="margin:24px 0 10px;font-size:13px;font-weight:700;letter-spacing:.04em;
              text-transform:uppercase;color:#9A9084;">
      Détail par produit
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="border-top:1px solid #F0EBE0;">
      ${productRows}
    </table>` : ''

  const body = `
    <!-- Kicker + title -->
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:.07em;
              text-transform:uppercase;color:#1F6F3F;">
      Bilan mensuel
    </p>
    <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#1F1B16;letter-spacing:-0.02em;">
      ${label}
    </h1>
    <p style="margin:0 0 28px;font-size:14px;font-weight:600;color:#9A9084;">
      ${clubName}
    </p>

    ${testBanner}

    <!-- Stats row 1 : Total | Commandes -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin-bottom:10px;">
      <tr>
        <td width="50%" style="padding-right:6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:#F6F1E8;border:1px solid #E1D8C5;border-radius:10px;padding:16px 18px;">
                <p style="margin:0 0 3px;font-size:11px;font-weight:700;letter-spacing:.06em;
                          text-transform:uppercase;color:#9A9084;">Total encaissé</p>
                <p style="margin:0;font-size:22px;font-weight:800;color:#1F1B16;letter-spacing:-0.02em;">
                  ${total}
                </p>
              </td>
            </tr>
          </table>
        </td>
        <td width="50%" style="padding-left:6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:#F6F1E8;border:1px solid #E1D8C5;border-radius:10px;padding:16px 18px;">
                <p style="margin:0 0 3px;font-size:11px;font-weight:700;letter-spacing:.06em;
                          text-transform:uppercase;color:#9A9084;">Commandes</p>
                <p style="margin:0;font-size:22px;font-weight:800;color:#1F1B16;letter-spacing:-0.02em;">
                  ${data.grandOrderCount}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Stats row 2 : Journées | Espèces / Carte -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin-bottom:0;">
      <tr>
        <td width="50%" style="padding-right:6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:#F6F1E8;border:1px solid #E1D8C5;border-radius:10px;padding:16px 18px;">
                <p style="margin:0 0 3px;font-size:11px;font-weight:700;letter-spacing:.06em;
                          text-transform:uppercase;color:#9A9084;">Journées actives</p>
                <p style="margin:0;font-size:22px;font-weight:800;color:#1F1B16;letter-spacing:-0.02em;">
                  ${data.days.length}
                </p>
              </td>
            </tr>
          </table>
        </td>
        <td width="50%" style="padding-left:6px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:#F6F1E8;border:1px solid #E1D8C5;border-radius:10px;padding:14px 18px;">
                <p style="margin:0 0 7px;font-size:11px;font-weight:700;letter-spacing:.06em;
                          text-transform:uppercase;color:#9A9084;">Répartition</p>
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#B47A1E;">
                  💶&nbsp; Espèces &nbsp;${especes}
                </p>
                <p style="margin:0;font-size:13px;font-weight:700;color:#2F6BBB;">
                  💳&nbsp; Carte &nbsp;${carte}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${productSection}

    <!-- PDF notice -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin-top:24px;">
      <tr>
        <td style="background:#E3EFE7;border-radius:10px;padding:14px 18px;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#1F6F3F;">
            📎&nbsp; Votre bilan détaillé est joint à cet e-mail (PDF)
          </p>
        </td>
      </tr>
    </table>
  `

  const preheader = isTest
    ? `[Test] Bilan ${label} — ${data.grandOrderCount} commandes, ${total}`
    : `Bilan ${label} — ${data.grandOrderCount} commandes, total ${total}`

  return wrapper(preheader, body)
}
