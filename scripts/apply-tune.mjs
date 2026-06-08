// Apply the approved tune-article proposals to D1. Reads the fetched .tune-*.json,
// applies hero/copy/SEO/FAQ + the OREI downscaling correction, verifies every
// "before" snippet matches, and emits UPDATE SQL. Run:
//   node scripts/apply-tune.mjs > apply-tune.sql   (then wrangler d1 execute --file)
import { readFileSync } from 'node:fs';

const q = (s) => (s == null ? 'NULL' : "'" + String(s).replace(/'/g, "''") + "'");
const NOW = new Date().toISOString();
const content = JSON.parse(readFileSync('.tune-content.json', 'utf8'))[0].results;
const product = JSON.parse(readFileSync('.tune-product.json', 'utf8'))[0].results[0];
const get = (slug) => content.find((r) => r.slug === slug);
const misses = [];

function applyReplacements(text, pairs, label) {
  let out = text;
  for (const [before, after] of pairs) {
    if (!out.includes(before)) {
      misses.push(label + ' :: NOT FOUND -> ' + before.slice(0, 70));
      continue;
    }
    out = out.split(before).join(after);
  }
  return out;
}

const kvmCopy = [
  ['The name stands for Keyboard, Video, Mouse, and that is exactly what it shares: you plug each computer into the switch, plug your peripherals into the switch\'s outputs, and flip control between machines with a button, a hotkey, or a remote.',
   'The name stands for Keyboard, Video, Mouse, and that is exactly what it shares. You plug each computer into the switch, plug your peripherals into the switch\'s outputs, and flip control between machines with a button, a hotkey, or a remote.'],
  ['A well-designed KVM also handles EDID, the data a monitor sends to tell a computer what resolutions it supports. With EDID emulation the switch keeps reporting the display to every computer even when it is not selected, so an idle machine does not think the monitor was unplugged.',
   'A well-designed KVM also handles EDID, the data a monitor sends to tell a computer which resolutions it supports. With EDID emulation the switch keeps reporting the display to every computer even when it is idle, so an unselected machine never thinks the monitor was unplugged.'],
  ['This is the rare dual-monitor 4K@60Hz KVM that bundles everything in the box: four HDMI cables, two USB cables, a power adapter, and a desktop switch controller, all at a mainstream price.',
   'This is the rare dual-monitor 4K@60Hz KVM that bundles everything in the box at a mainstream price: four HDMI cables, two USB cables, a power adapter, and a desktop switch controller.'],
  ['The standout is per-input EDID emulation, which keeps idle PCs seeing the monitor so your desktop icons and window layouts do not scramble on switch, the exact failure mode buyers complain about on cheaper HDMI KVMs.',
   'The standout is per-input EDID emulation, which keeps idle PCs seeing the monitor so your desktop icons and window layouts do not scramble on switch. That is the exact failure mode buyers complain about on cheaper HDMI KVMs.'],
  ['It supports 4K@60Hz with 1440p@120Hz and 1080p@240Hz fallbacks, includes four USB 3.0 ports, and ships with both a one-button switch and a wired desktop controller. Owners love how it collapses two boxes into one tidy unit at a low price.',
   'It supports 4K@60Hz with 1440p@120Hz and 1080p@240Hz fallbacks, includes four USB 3.0 ports, and ships with both a one-button switch and a wired desktop controller. Owners love how it collapses two computers into one tidy desk at a low price.'],
  ['The cheapest fully-equipped pick here, this UGREEN single-monitor 4K@60Hz switch undercuts most competitors while still bundling two HDMI cables, two USB cables, a power adapter, and a desktop controller, so there is nothing extra to buy.',
   'The cheapest fully-equipped pick here, this UGREEN single-monitor 4K@60Hz switch undercuts most competitors yet still bundles two HDMI cables, two USB cables, a power adapter, and a desktop controller, so there is nothing extra to buy.'],
  ['If you switch many times a day and hate seeing your windows rearrange, spend a little less',
   'If you switch many times a day and hate watching your windows rearrange, spend a little less'],
];

const hdmiCopy = [
  ['a 4x2 matrix has 4 source inputs and 2 displays, a 4x4 has 4 of each. The key word is independently. Output 1 can show the PS5 while output 2 shows the cable box, and you can change either one without disturbing the other.',
   'a 4x2 matrix has 4 source inputs and 2 displays, a 4x4 has 4 of each. The key word is independently: output 1 can show the PS5 while output 2 shows the cable box, and you can change either one without disturbing the other.'],
  ['and the switch sends the chosen source to the chosen display.',
   'and the switch routes the chosen source to the chosen display.'],
  ['HDCP authentication is required by protected 4K content, so the matrix has to pass HDCP 2.2 correctly or you get a blank or error screen.',
   'Protected 4K content requires HDCP authentication, so the matrix has to pass HDCP 2.2 correctly or you get a blank or error screen.'],
  ['Audio extraction pulls the sound out to optical, analog, or an ARC return path for a soundbar or AV receiver, instead of trapping it inside the HDMI stream.',
   'Audio extraction pulls sound out to optical, analog, or an ARC return path for a soundbar or AV receiver instead of trapping it inside the HDMI stream.'],
  ['18Gbps, HDR10, plus the feature buyers single out most',
   '18Gbps, and HDR10, plus the feature buyers single out most'],
  ['and power-off memory that restores your routing after an outage. Each output also auto-downscales to 1080p.',
   'and power-off memory that restores your routing after an outage. Each output also auto-downscales to 1080p for older displays.'],
  ['so it is not for fast source-flipping.', 'so it is not the box for fast source-flipping.'],
  ['and a 4K-to-1080p scaler so it can output 4K and 1080p at once.',
   'and a 4K-to-1080p scaler that can drive a 4K and a 1080p display at the same time.'],
];

// OREI downscaling correction (applied to the HDMI body AFTER copy edits)
const oreiBodyFix = [
  ['independent 4K-to-1080p downscaling on each output', 'independent 4K-to-1080p downscaling on any two of its four outputs'],
  ['A 4K-to-1080p downscaler on every output', 'A 4K-to-1080p downscaler on any two of the four outputs'],
  ['downscales per output so a 1080p TV does not hold back your 4K screens', 'downscales two of its outputs to 1080p so a 1080p TV does not hold back your 4K screens'],
];

const seo = {
  'what-is-a-kvm-switch': {
    title: 'What Is a KVM Switch? How It Works + Best 2026',
    desc: 'A KVM switch runs two computers from one keyboard, mouse, and monitor. Learn how they work, why EDID matters, and the 5 best HDMI KVM switches for 2026.',
  },
  'what-does-an-hdmi-matrix-do': {
    title: 'What Does an HDMI Matrix Do? Best 4x4 & 4x2 Picks',
    desc: 'What an HDMI matrix does and how it differs from a splitter or switch, plus the 4 best 4x4 and 4x2 HDMI matrix switches in 2026, ranked from real owner reviews.',
  },
};

const hero = {
  'what-is-a-kvm-switch': {
    url: 'https://images.unsplash.com/photo-1747633130999-dbf3527b0639?w=1600&q=80&auto=format&fit=crop',
    alt: 'A tidy computer desk with a monitor, a laptop, a compact keyboard, and a mouse',
  },
  'what-does-an-hdmi-matrix-do': {
    url: 'https://images.unsplash.com/photo-1680992046626-418f7e910589?w=1600&q=80&auto=format&fit=crop',
    alt: 'A rack of stacked audio-video equipment with cabling',
  },
};

// FAQ operations per slug
const faqOps = {
  'what-is-a-kvm-switch': {
    reword: [{
      match: 'Why does my switch say 4K',
      q: 'Why does my KVM switch say 4K but text and motion still look bad?',
      a: 'Almost always because it is doing 4K at only 30Hz, or outputting reduced color instead of full 4:4:4. 4K at 30Hz makes the cursor and scrolling feel laggy on a desktop, and reduced color smears small text. For a comfortable desktop, buy a switch explicitly rated 4K at 60Hz with 4:4:4. For high-refresh gaming you need an HDMI 2.1 model rated for 4K at 120Hz or higher.',
    }],
    add: [
      { q: 'Can I use a KVM switch with three or more computers?', a: 'Yes. Most consumer HDMI KVMs handle two computers, but four-port models exist if you need to switch among three or four machines from one keyboard, mouse, and monitor. The picks in this guide are two-port, two-computer units, which covers the common work-laptop-plus-personal-desktop setup. If you need more inputs, look specifically for a 4-port KVM and confirm it keeps the same 4K at 60Hz and EDID handling, since adding ports sometimes lowers the supported resolution.' },
      { q: 'Does a KVM switch slow down USB file transfers or webcams?', a: 'Only if its hub ports are USB 2.0. A keyboard and mouse run fine on USB 2.0, but a fast SSD, a 4K webcam, or a capture card needs USB 3.0 (5Gbps or better) on the switch\'s hub ports, or transfers crawl and high-resolution video stutters. Every pick in this guide uses USB 3.0 ports at 5Gbps. Plug speed-sensitive gear into those ports, and remember the hub only serves the computer that is currently active.' },
    ],
  },
  'what-does-an-hdmi-matrix-do': {
    reword: [],
    add: [
      { q: 'What is the difference between an HDMI matrix, splitter, and switch?', a: 'A splitter sends one source to many displays (the same picture everywhere). A switch sends many sources to one display (you pick one at a time). An HDMI matrix does both at once: it routes any of several sources to any of several displays independently, so output 1 can show the PS5 while output 2 shows the cable box, and you can change either without disturbing the other.' },
      { q: 'What does per-output downscaling on an HDMI matrix do?', a: 'It lets an output drop 4K to 1080p for an older TV while another output still gets native 4K. Without it, a single 1080p screen can force every output down to 1080p through EDID, so it is the feature that keeps a mixed-display setup running at each screen\'s best resolution. Confirm a matrix offers it before pairing a 4K and a 1080p display.' },
    ],
  },
};

const out = ['-- apply-tune: approved hero + copy + SEO + FAQ + OREI downscaling fix. ' + NOW];

for (const slug of ['what-is-a-kvm-switch', 'what-does-an-hdmi-matrix-do']) {
  const row = get(slug);
  if (!row) { misses.push('content row missing: ' + slug); continue; }
  let body = applyReplacements(row.body_md, slug === 'what-is-a-kvm-switch' ? kvmCopy : hdmiCopy, slug + ' copy');
  if (slug === 'what-does-an-hdmi-matrix-do') body = applyReplacements(body, oreiBodyFix, 'orei body');
  const structured = JSON.parse(row.structured_json || '{}');
  const ops = faqOps[slug];
  structured.faq = Array.isArray(structured.faq) ? structured.faq : [];
  for (const rw of ops.reword) {
    const idx = structured.faq.findIndex((f) => typeof f.q === 'string' && f.q.includes(rw.match));
    if (idx >= 0) structured.faq[idx] = { q: rw.q, a: rw.a };
    else misses.push(slug + ' faq reword: NOT FOUND -> ' + rw.match);
  }
  for (const add of ops.add) {
    if (!structured.faq.some((f) => f.q === add.q)) structured.faq.push(add);
  }
  const h = hero[slug], s = seo[slug];
  out.push(
    'UPDATE content SET body_md=' + q(body) + ', structured_json=' + q(JSON.stringify(structured)) +
    ', seo_title=' + q(s.title) + ', seo_description=' + q(s.desc) +
    ', hero_image_url=' + q(h.url) + ', hero_alt=' + q(h.alt) +
    ', updated_at=' + q(NOW) + ' WHERE slug=' + q(slug) + ';',
  );
}

// OREI product downscaling correction
let pDesc = applyReplacements(product.description, [['with per-output 4K-to-1080p downscaling', 'with 4K-to-1080p downscaling on any two of its four outputs']], 'orei product desc');
let pPros = applyReplacements(product.pros_json, [['with a 4K-to-1080p downscaler on each output', 'with a 4K-to-1080p downscaler on any two of the four outputs']], 'orei product pros');
let pSpecs = applyReplacements(product.specs_json, [['4K-to-1080p per output', '4K-to-1080p on any 2 of 4 outputs']], 'orei product specs');
out.push('UPDATE products SET description=' + q(pDesc) + ', pros_json=' + q(pPros) + ', specs_json=' + q(pSpecs) + ', updated_at=' + q(NOW) + " WHERE id='orei-uhd404r';");

if (misses.length) {
  console.error('UNMATCHED (' + misses.length + '):');
  for (const m of misses) console.error('  ' + m);
} else {
  console.error('All ' + (kvmCopy.length + hdmiCopy.length + oreiBodyFix.length + 3) + ' text replacements matched. FAQ + hero + SEO applied.');
}
console.log(out.join('\n'));
