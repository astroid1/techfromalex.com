// Corrective fix: the TESmart 4x4 pick linked ASIN B0854349RV, which is the older
// HMA404-L23 variant (4K@30Hz, HDMI 1.4, no IP) and does NOT match the described
// 4K@60Hz / HDMI 2.0 / IP specs. The genuine 4K@60Hz model is not on Amazon US, so
// we drop that pick. This rewrites the HDMI guide to 4 verified picks and deletes
// the bad product. Run:
//   node scripts/fix-hdmi-drop-tesmart.mjs > /tmp/fix.sql
//   wrangler d1 execute techfromalex_db --remote --file=/tmp/fix.sql

const NOW = new Date().toISOString();
const q = (s) => (s == null ? "NULL" : "'" + String(s).replace(/'/g, "''") + "'");
const json = (o) => q(JSON.stringify(o));

const dek = "An HDMI matrix routes several sources to several displays independently. Here is how it works, what to look for, and the four best HDMI matrix switches.";

const body = `An HDMI matrix switch connects several HDMI sources (game consoles, streaming boxes, cable boxes, PCs) to several displays and lets you route any input to any output, independently and at the same time. The naming is always inputs by outputs: a 4x2 matrix has 4 source inputs and 2 displays, a 4x4 has 4 of each. The key word is independently. Output 1 can show the PS5 while output 2 shows the cable box, and you can change either one without disturbing the other.

That makes a matrix the right tool when you have multiple sources and multiple screens that each need their own picture: a home theater plus a bedroom TV, a sports bar with several screens, or a conference room feeding two projectors. Below we explain how a matrix works, what to look for, and the four we would buy, ranked from real owner feedback.

## How an HDMI Matrix Works

Inside, a matrix is a crosspoint of switching logic that can connect any input to any output on demand. You pick the routing with front-panel buttons, an IR remote, RS-232 or IP control, or a web page, and the switch sends the chosen source to the chosen display. Two behind-the-scenes processes make it reliable. EDID handshakes let each source read what a display supports before sending video, so a good matrix manages EDID carefully when one source feeds two different screens. HDCP authentication is required by protected 4K content, so the matrix has to pass HDCP 2.2 correctly or you get a blank or error screen.

Better units add two features worth paying for. Per-output scaling lets one output downscale 4K to 1080p for an older TV while another output still gets native 4K. Audio extraction pulls the sound out to optical, analog, or an ARC return path for a soundbar or AV receiver, instead of trapping it inside the HDMI stream.

:::callout{type="info" title="Matrix vs splitter, switch, and KVM"}
A splitter is one input to many outputs (the same picture everywhere). A switch is many inputs to one output (pick one source for one screen). A matrix is many inputs to many outputs with independent routing (any source to any screen). A KVM is a different category: it switches a keyboard, mouse, and video to control computers, not to distribute AV around a building.
:::

## What to Look For

- **Port count (NxM):** match inputs to your sources and outputs to your displays, with a little headroom. You cannot add ports later.
- **Bandwidth and resolution:** 18Gbps (HDMI 2.0) handles 4K@60Hz HDR. You only need a pricier HDMI 2.1 matrix (40 to 48Gbps) for 4K@120Hz, 8K, or VRR gaming.
- **HDR and HDCP:** confirm pass-through of the HDR formats you use (HDR10, Dolby Vision, HLG) and HDCP 2.2, or protected 4K sources will blank out.
- **EDID management:** flexible EDID modes are the single biggest factor in avoiding no-signal and wrong-resolution problems in mixed-display setups.
- **Per-output downscaling:** lets one output drop to 1080p for an old TV while another stays 4K. Without it, one 1080p screen can drag every output down.
- **Control:** buttons and an IR remote cover most homes; installers want RS-232, IP, or a web UI for automation.

## The Best HDMI Matrix Switches

### Best Overall: OREI UHD-404R 4x4

::product-card{id="orei-uhd404r"}

The UHD-404R is the most complete consumer 4x4 we found: full HDMI 2.0 and HDCP 2.2 at 4K@60Hz 4:4:4, 18Gbps, HDR10, plus the feature buyers single out most, independent 4K-to-1080p downscaling on each output, so one 1080p display does not drag the others down. Reviewers praise its versatility, build quality, audio extraction, and RS-232 control. A subset of owners report occasional input-recognition hiccups, but OREI's responsive US support is a recurring positive in the reviews.

:::pros-cons
pros:
- Independent any-source-to-any-display routing for 4 of each
- A 4K-to-1080p downscaler on every output
- Full 4K@60Hz 4:4:4, HDCP 2.2, 18Gbps, and HDR10
- Optical and analog audio extraction plus ARC on Output A

cons:
- A subset of owners report intermittent input-not-recognized issues
- Does not bitstream lossless TrueHD or DTS-MA to some receivers
- No web or IP control (RS-232 only)
:::

### Best for Custom Installers: AV Access 4KMX44-H2A

::product-card{id="avaccess-4kmx44"}

If you want browser-based control, the 4KMX44-H2A is the integrator's pick. Alongside full 4K@60Hz 4:4:4 with HDR10, HLG, and Dolby Vision, it adds a built-in Web UI, a documented RS-232 API, per-output SPDIF 5.1CH audio breakout, and power-off memory that restores your routing after an outage. Each output also auto-downscales to 1080p. Its review base is smaller than the mainstream options, and the community notes occasional ARC or CEC quirks after rearranging outputs, but for automation it is the most flexible box here.

:::pros-cons
pros:
- Browser Web UI plus a documented RS-232 API and IR remote
- HDR10, HLG, and Dolby Vision at 4K@60Hz 4:4:4
- Auto-downscaling to 1080p on each output
- Power-off memory restores the last routing

cons:
- Occasional ARC or CEC quirks after rearranging outputs
- Smaller review base than the mainstream options
- Web UI and API setup has a learning curve
:::

### Best Dual-Display (4x2): AV Access 4KMX42-H2A

::product-card{id="avaccess-4kmx42"}

If you only need two displays, the 4KMX42-H2A is the standout 4x2: four 4K@60Hz 4:4:4 HDR sources routed independently to two outputs, with a 4K-to-1080p scaler per output, ARC, and both SPDIF 5.1CH and 3.5mm audio breakout. It costs far less than a 4x4 while keeping the same video pipeline and an RS-232 API. Just note that owners flag input switching of roughly five to eight seconds, so it is not for fast source-flipping.

:::pros-cons
pros:
- Four 4K@60Hz HDR sources routed independently to two displays
- Per-output 4K-to-1080p downscaler
- Flexible audio breakout (SPDIF 5.1CH, 3.5mm, ARC)
- HDCP 2.2, 18Gbps, with an RS-232 API

cons:
- Input switching is slow (around 5 to 8 seconds)
- Only two outputs, not a 4-display solution
- No web UI (RS-232 or IR only)
:::

### Best Budget and Gaming: avedio links 4x2

::product-card{id="avedio-matrix-4x2"}

This is the value pick and the high-refresh option: a 4-in, 2-out matrix under $100 that still does HDR10 and Dolby Vision at 4K@60Hz 4:4:4, plus the high refresh rates gamers want (1080p@144Hz, 1440p@120Hz) and a 4K-to-1080p scaler so it can output 4K and 1080p at once. It carries the strongest rating and largest review base of the matrices here. As a generic-brand unit it lacks RS-232 or IP control and the support depth of the big names, so it is best for home rather than installed use.

:::pros-cons
pros:
- Lowest price while still doing 4K@60Hz 4:4:4, HDR10, and Dolby Vision
- High refresh rates gamers value (1080p@144Hz, 1440p@120Hz)
- 4K-to-1080p scaler drives a 4K and a 1080p display at once
- Highest rating and largest review base of the matrices here

cons:
- Generic brand with limited long-term support
- Only IR remote and buttons (no RS-232 or IP)
- Only two outputs (4x2)
:::

## How They Compare

| Model | Best for | Config | Downscaler | Control | Price |
|-------|----------|--------|-----------|---------|-------|
| OREI UHD-404R | All-around 4x4 | 4x4 | Yes | IR, RS-232 | ~$220 |
| AV Access 4KMX44 | Installers | 4x4 | Yes | Web UI, RS-232 | ~$259 |
| AV Access 4KMX42 | Two displays | 4x2 | Yes | IR, RS-232 | ~$159 |
| avedio links 4x2 | Budget and gaming | 4x2 | Yes | IR only | ~$90 |

## How We Picked

We compared true independent routing, 4K@60Hz, HDR, and HDCP completeness, EDID and downscaling behavior, control options, and owner ratings across the most-recommended 4x4 and 4x2 matrices, confirming a real Amazon listing for every pick.

## The Bottom Line

For most home theaters, the :product[OREI UHD-404R]{id="orei-uhd404r"} is the best all-around 4x4: it routes four sources to four displays and downscales per output so a 1080p TV does not hold back your 4K screens. If you only have two displays, the :product[AV Access 4KMX42-H2A]{id="avaccess-4kmx42"} does the same job for less, and the :product[avedio links 4x2]{id="avedio-matrix-4x2"} covers a budget or gaming setup for under $100.`;

const structured = {
  criteria: ["Independent routing", "4K@60Hz, HDR, HDCP", "Per-output downscaling", "Control options", "Owner ratings"],
  howWeChose: "We compared true independent routing, 4K@60Hz, HDR, and HDCP completeness, EDID and downscaling behavior, control options, and owner ratings across the most-recommended 4x4 and 4x2 matrices, confirming a real Amazon listing for every pick.",
  picks: [
    { rank: 1, productId: "orei-uhd404r", award: "Best Overall", bestFor: "an all-around 4-display home theater", rationale: "The most complete consumer 4x4: full 4K@60Hz 4:4:4 with a 4K-to-1080p downscaler on every output." },
    { rank: 2, productId: "avaccess-4kmx44", award: "Best for Installers", bestFor: "browser and RS-232 control", rationale: "A 4x4 with Web UI, a documented RS-232 API, and power-off memory, the most flexible box for automation." },
    { rank: 3, productId: "avaccess-4kmx42", award: "Best Dual-Display", bestFor: "two displays with audio breakout", rationale: "The standout 4x2: four HDR sources to two outputs with per-output downscaling, for far less than a 4x4." },
    { rank: 4, productId: "avedio-matrix-4x2", award: "Best Budget and Gaming", bestFor: "a budget or high-refresh home setup", rationale: "Under $100 with HDR10, Dolby Vision, high refresh rates, and a 4K-to-1080p scaler; the highest-rated matrix here." },
  ],
  faq: [
    { q: "What does 4x2 or 4x4 actually mean?", a: "It is inputs by outputs. A 4x2 matrix accepts 4 HDMI sources and feeds 2 displays; a 4x4 feeds 4 displays. The first number is how many source devices you can plug in, the second is how many screens you can drive. Count your real sources and displays before buying, and leave a little headroom since you cannot expand the port count later." },
    { q: "Can each TV really show something different at the same time?", a: "Yes, that is the entire point of a matrix versus a splitter. Each output is routed independently, so display 1 can show your console while display 2 shows cable, and you can change either one without affecting the other. A splitter, by contrast, forces every screen to show the identical source." },
    { q: "Do I need an HDMI 2.1 matrix, or is 2.0 (18Gbps) enough?", a: "For standard 4K at 60Hz HDR video (streaming, Blu-ray, most home theater), an 18Gbps HDMI 2.0 matrix is enough and cheaper. You only need an HDMI 2.1, 40 to 48Gbps matrix if you are driving 4K at 120Hz or 8K, or want gaming features like VRR from a PS5, Xbox Series X, or gaming PC. Match it to your actual sources and displays rather than buying 2.1 just in case." },
    { q: "Why do I get a black screen, no signal, or no Dolby Vision through my matrix?", a: "Almost always an EDID or HDCP issue. If a source cannot read a valid EDID it may output nothing or the wrong resolution; switching the matrix's EDID mode usually fixes it. Black screens on protected 4K content point to HDCP, so the unit needs HDCP 2.2. Missing HDR or Dolby Vision means the matrix does not pass that specific format. Power-cycling the whole chain after changes also helps the handshake settle." },
    { q: "Will a matrix downscale 4K so my old 1080p TV still works alongside a 4K TV?", a: "Only if it has independent per-output scaling, so look for that feature explicitly. With it, the output feeding the old TV converts 4K to 1080p while the 4K TV still gets native 4K. Without it, plugging in one 1080p display can drag every output down to 1080p, because EDID negotiates to the lowest common capability. The OREI and AV Access picks above include per-output downscaling." },
    { q: "Can I run the displays in different rooms across the house?", a: "Plain HDMI outputs are only reliable to roughly 15 to 25 feet, so for whole-home distribution choose a matrix with HDBaseT or HDMI-over-Cat6 outputs that send signal to a small receiver box at each remote TV. For shorter in-room runs, active or fiber-optic HDMI cables can stretch standard outputs. Do not expect a basic matrix with bare HDMI ports to feed a TV three rooms away." },
  ],
};

const out = [];
out.push("-- fix-hdmi-drop-tesmart: remove wrong-variant TESmart pick, rewrite HDMI guide to 4 picks. " + NOW);
out.push(`DELETE FROM content_products WHERE content_id = 'what-does-an-hdmi-matrix-do' AND product_id = 'tesmart-matrix-4x4';`);
out.push(`DELETE FROM product_links WHERE product_id = 'tesmart-matrix-4x4';`);
out.push(`DELETE FROM products WHERE id = 'tesmart-matrix-4x4';`);
out.push(
  `UPDATE content SET dek = ${q(dek)}, body_md = ${q(body)}, structured_json = ${json(structured)}, updated_at = ${q(NOW)} WHERE id = 'what-does-an-hdmi-matrix-do';`,
);
console.log(out.join("\n"));
