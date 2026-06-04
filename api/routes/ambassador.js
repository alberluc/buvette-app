import { Router } from 'express'
import { sendMail } from '../lib/mailer.js'

const router = Router()

const FIELDS = ['club_name', 'sport', 'city', 'volunteers', 'email']
const VOLUNTEERS_VALUES = ['1-3', '4-10', '10+']

router.post('/ambassador', async (req, res) => {
  const { club_name, sport, city, volunteers, email } = req.body

  if (FIELDS.some(f => !req.body[f] || typeof req.body[f] !== 'string')) {
    return res.status(400).json({ error: 'Tous les champs sont requis.' })
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide.' })
  }
  if (!VOLUNTEERS_VALUES.includes(volunteers)) {
    return res.status(400).json({ error: 'Valeur invalide.' })
  }

  const dest = process.env.CONTACT_EMAIL || process.env.SMTP_USER
  try {
    await sendMail({
      to: dest,
      subject: `Candidature ambassadeur — ${club_name.trim()}`,
      html: `
        <h2>Nouvelle candidature ambassadeur</h2>
        <table>
          <tr><td><strong>Club</strong></td><td>${escHtml(club_name)}</td></tr>
          <tr><td><strong>Sport</strong></td><td>${escHtml(sport)}</td></tr>
          <tr><td><strong>Localisation</strong></td><td>${escHtml(city)}</td></tr>
          <tr><td><strong>Bénévoles buvette</strong></td><td>${escHtml(volunteers)}</td></tr>
          <tr><td><strong>Email</strong></td><td>${escHtml(email)}</td></tr>
        </table>
      `,
    })
    res.status(201).json({ ok: true })
  } catch (err) {
    console.error('[ambassador]', err)
    res.status(500).json({ error: 'Erreur serveur.' })
  }
})

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default router
