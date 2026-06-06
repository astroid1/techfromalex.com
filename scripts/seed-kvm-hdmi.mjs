// One-off seed: two ranked buying guides (KVM switches, HDMI matrices) + 10 real,
// verified Amazon products with tagged affiliate links. Run:
//   node scripts/seed-kvm-hdmi.mjs > /tmp/seed-kvm-hdmi.sql
// then apply with: wrangler d1 execute techfromalex_db --remote --file=/tmp/seed-kvm-hdmi.sql
// Every ASIN below was verified to a live amazon.com/dp/<ASIN> listing.

const NOW = new Date().toISOString();
const q = (s) => (s == null ? "NULL" : "'" + String(s).replace(/'/g, "''") + "'");
const json = (o) => q(JSON.stringify(o));
const n = (x) => (x == null ? "NULL" : String(x));
const cents = (usd) => Math.round(usd * 100);
const dp = (asin) => `https://www.amazon.com/dp/${asin}`;
const specsObj = (arr) => Object.fromEntries(arr.map((s) => [s.name, s.value]));

const products = [
  // ---- KVM switches
  {
    id: "ugreen-kvm-2monitor", asin: "B0DXF66SWR", brand: "UGREEN", category: "kvm-switch",
    name: "UGREEN HDMI KVM Switch (2 Monitors, 2 Computers, 4K@60Hz)", price: 129.99, rating: 4.1,
    description: "A complete dual-monitor 4K@60Hz KVM that ships with every cable, a power adapter, and a desktop switch controller in the box.",
    pros: ["True dual-monitor 4K@60Hz (HDMI 2.0, HDR, HDCP 2.2) for two computers", "Comes complete: 4 HDMI cables, 2 USB cables, power adapter, and desktop controller", "4 USB 3.0 ports (3 USB-A plus 1 USB-C) share peripherals and drives at 5Gbps", "Large, generally positive review base and true plug-and-play setup"],
    cons: ["No full EDID emulation, so windows can rearrange or briefly black-screen on switch", "Some owners report a multi-second delay re-detecting 4K displays", "Four HDMI runs make for noticeable cable clutter"],
    specs: [{ name: "Computers / Monitors", value: "2 computers, 2 monitors" }, { name: "Max resolution", value: "4K@60Hz (HDMI 2.0)" }, { name: "USB hub", value: "4x USB 3.0, 5Gbps" }, { name: "EDID emulation", value: "No" }, { name: "Switching", value: "Button + wired desktop controller" }],
  },
  {
    id: "tesmart-kvm-edid", asin: "B08124CPLM", brand: "TESmart", category: "kvm-switch",
    name: "TESmart HDMI KVM Switch (1 Monitor, 2 Computers, 4K@60Hz, EDID)", price: 89.99, rating: 4.4,
    description: "TESmart's reliability pick: a single-monitor 4K@60Hz KVM with per-input EDID emulation that keeps your window layout intact when you switch.",
    pros: ["Per-input EDID emulation keeps window and icon layouts intact when switching", "Strong reputation for stable, snappy switching across reviews and roundups", "USB 3.0 hub (5Gbps) plus separate L/R audio and microphone jacks", "Hotkey, front button, and included IR remote switching"],
    cons: ["Costs more than no-name HDMI KVMs of similar port count", "Single monitor only (the dual-display models cost more)", "A minority of owners report audio or mic quirks"],
    specs: [{ name: "Computers / Monitors", value: "2 computers, 1 monitor" }, { name: "Max resolution", value: "4K@60Hz (2K@120Hz, 1080p@240Hz)" }, { name: "USB hub", value: "USB 3.0, 5Gbps" }, { name: "EDID emulation", value: "Yes, per input" }, { name: "Audio", value: "L/R audio out plus mic in" }],
  },
  {
    id: "ckl-kvm-922hua3", asin: "B08SVPXQY8", brand: "CKL", category: "kvm-switch",
    name: "CKL Dual Monitor HDMI KVM Switch 922HUA-3 (4K@60Hz)", price: 159.99, rating: 4.3,
    description: "A specialist KVM maker's dual-monitor workhorse with one of the deepest review pools in the category and true extended-desktop switching at 4K@60Hz.",
    pros: ["Dual 4K@60Hz extended or mirrored display from two computers", "From a dedicated KVM brand with a very large review base", "Adds 2 extra USB 3.0 hub ports (5Gbps) plus audio and mic", "All HDMI and USB cables included; reviewers praise CKL support"],
    cons: ["Some owners report occasional audio dropouts or monitor cutouts", "Sensitive to cheap or long HDMI cables", "A minority receive faulty units (mixed quality control)"],
    specs: [{ name: "Computers / Monitors", value: "2 computers, 2 monitors" }, { name: "Max resolution", value: "4K@60Hz per display (HDMI 2.0)" }, { name: "USB hub", value: "2x USB 3.0, 5Gbps" }, { name: "Switching", value: "Front button plus hotkey" }, { name: "Audio", value: "Audio out plus mic in" }],
  },
  {
    id: "ugreen-kvm-1monitor", asin: "B0CQM47NVX", brand: "UGREEN", category: "kvm-switch",
    name: "UGREEN HDMI KVM Switch (1 Monitor, 2 Computers, 4K@60Hz)", price: 69.99, rating: 4.3,
    description: "UGREEN's high-volume single-monitor seller: a tidy, affordable way to run a work laptop and a personal desktop on one 4K screen.",
    pros: ["4K@60Hz HDMI plus 1440p@120Hz and 1080p@240Hz fallbacks", "Four USB 3.0 ports (3 USB-A plus 1 USB-C) at 5Gbps", "Replaces a separate display switch and KVM in one tidy unit", "Includes a one-button switch and a wired desktop controller"],
    cons: ["Limited EDID emulation can rearrange windows on switch", "Some owners report a brief black screen re-detecting 4K", "Single monitor only"],
    specs: [{ name: "Computers / Monitors", value: "2 computers, 1 monitor" }, { name: "Max resolution", value: "4K@60Hz (1440p@120Hz, 1080p@240Hz)" }, { name: "USB hub", value: "4x USB 3.0, 5Gbps" }, { name: "EDID emulation", value: "Limited" }, { name: "Switching", value: "Button plus desktop controller" }],
  },
  {
    id: "ugreen-kvm-budget", asin: "B0DC5ZZMKD", brand: "UGREEN", category: "kvm-switch",
    name: "UGREEN HDMI KVM Switch (1 Monitor, 2 Computers, 4K@60Hz, with Power Adapter)", price: 59.99, rating: 4.2,
    description: "The cheapest complete kit here: a single-monitor 4K@60Hz KVM that still bundles cables, a power adapter, and a controller, so there is nothing extra to buy.",
    pros: ["Lowest price of the group while still including cables, power adapter, and controller", "4K@60Hz HDMI 2.0 with a 1440p@120Hz fallback", "Four USB 3.0 ports (3 USB-A plus 1 USB-C) at 5Gbps", "No drivers required; broad Windows, macOS, and Linux support"],
    cons: ["Lacks robust EDID emulation, so windows can rearrange on switch", "Smaller review base than UGREEN's flagship single-monitor unit", "Single monitor only"],
    specs: [{ name: "Computers / Monitors", value: "2 computers, 1 monitor" }, { name: "Max resolution", value: "4K@60Hz (4K@30Hz, 1440p@120Hz)" }, { name: "USB hub", value: "4x USB 3.0, 5Gbps" }, { name: "In box", value: "2 HDMI plus 2 USB cables, power adapter, controller" }],
  },
  // ---- HDMI matrices
  {
    id: "orei-uhd404r", asin: "B0BRR1ZF41", brand: "OREI", category: "hdmi-matrix",
    name: "OREI UHD-404R 4x4 HDMI Matrix Switch (4K@60Hz, Downscaler)", price: 219.99, rating: 4.0,
    description: "The most complete consumer 4x4 we found: full 4K@60Hz 4:4:4 with per-output 4K-to-1080p downscaling, so a 1080p TV and a 4K TV can run off the same matrix.",
    pros: ["Routes any of 4 sources to any of 4 displays, with a 4K-to-1080p downscaler on each output", "Full 4K@60Hz 4:4:4, HDMI 2.0, HDCP 2.2, 18Gbps, and HDR10", "Optical (SPDIF) and analog audio extraction, plus ARC on Output A", "US-based OREI support that reviewers say resolves compatibility issues"],
    cons: ["A subset of owners report intermittent input-not-recognized issues needing a re-plug", "Does not bitstream lossless Dolby TrueHD or DTS-MA to some receivers", "No web or IP control on this model (RS-232 only)"],
    specs: [{ name: "Configuration", value: "4x4 (4 in, 4 out) true matrix" }, { name: "Max resolution", value: "4K@60Hz 4:4:4, 18Gbps" }, { name: "HDR / HDCP", value: "HDR10; HDMI 2.0; HDCP 2.2" }, { name: "Downscaling", value: "4K-to-1080p per output" }, { name: "Control", value: "Front panel, IR remote, EDID, RS-232" }],
  },
  {
    id: "avaccess-4kmx44", asin: "B08FJ4FKB7", brand: "AV Access", category: "hdmi-matrix",
    name: "AV Access 4KMX44-H2A 4x4 HDMI Matrix (4K@60Hz, Web UI)", price: 259.0, rating: 4.3,
    description: "The integrator's pick: a 4x4 matrix with browser-based Web UI control, a documented RS-232 API, power-off memory, and per-output audio breakout.",
    pros: ["Browser-based Web UI plus documented RS-232 API and IR remote", "Full HDR10, HLG, and Dolby Vision at 4K@60Hz 4:4:4, HDCP 2.2, 18Gbps", "Independent auto-downscaling to 1080p on each output", "Power-off memory restores the last routing automatically"],
    cons: ["Community reports occasional ARC or CEC quirks after rearranging outputs", "Smaller review base than the mainstream options", "Web UI and API setup has a learning curve"],
    specs: [{ name: "Configuration", value: "4x4 (4 in, 4 out) true matrix" }, { name: "Max resolution", value: "4K@60Hz 4:4:4, 18Gbps" }, { name: "HDR / HDCP", value: "HDR10, HLG, Dolby Vision; HDCP 2.2" }, { name: "Downscaling", value: "4K-to-1080p per output" }, { name: "Control", value: "Web UI, RS-232 API, IR, buttons; power-off memory" }],
  },
  {
    id: "tesmart-matrix-4x4", asin: "B0854349RV", brand: "TESmart", category: "hdmi-matrix",
    name: "TESmart 4x4 HDMI Matrix Switch (4K@60Hz, RS-232 and IP)", price: 239.99, rating: 4.2,
    description: "TESmart's reliability and control workhorse: dependable 4K@60Hz 4:4:4 routing with front keypad, IR, RS-232, and IP control plus power-down routing memory.",
    pros: ["Reliable, true plug-and-play 4x4 routing praised on AV forums", "4K@60Hz 4:4:4, HDMI 2.0, HDCP 2.2", "Strong control suite: keypad, IR, RS-232, and IP/LAN", "Audio output on each port; power-down memory restores routing"],
    cons: ["No built-in 4K-to-1080p downscaler, so a 1080p display can pull others down via EDID", "No user-selectable EDID menu, which complicates mixed setups", "Front-panel LEDs are very bright"],
    specs: [{ name: "Configuration", value: "4x4 (4 in, 4 out) true matrix" }, { name: "Max resolution", value: "4K@60Hz 4:4:4" }, { name: "HDR / HDCP", value: "HDMI 2.0; HDCP 2.2; Deep Color, 3D" }, { name: "Downscaling", value: "Not supported" }, { name: "Control", value: "Keypad, IR, RS-232, IP/LAN; power-down memory" }],
  },
  {
    id: "avaccess-4kmx42", asin: "B07Z4PZMLP", brand: "AV Access", category: "hdmi-matrix",
    name: "AV Access 4KMX42-H2A 4x2 HDMI Matrix (4K@60Hz)", price: 159.0, rating: 4.3,
    description: "The standout 4x2 for two-display setups: four 4K@60Hz HDR sources routed independently to two outputs, with a per-output downscaler and flexible audio breakout.",
    pros: ["Four 4K@60Hz 4:4:4 HDR sources routed independently to two displays", "Per-output 4K-to-1080p downscaler keeps a 1080p display from limiting the 4K output", "Flexible audio breakout: SPDIF 5.1CH, 3.5mm analog, plus ARC", "HDCP 2.2, 18Gbps, HDMI 2.0, with an RS-232 API"],
    cons: ["Input switching is slow (owners cite roughly 5 to 8 seconds)", "Only two outputs, so not a substitute for a 4-display 4x4", "No web UI on the 4x2 (RS-232 or IR only)"],
    specs: [{ name: "Configuration", value: "4x2 (4 in, 2 out) true matrix" }, { name: "Max resolution", value: "4K@60Hz 4:4:4, 18Gbps" }, { name: "HDR / HDCP", value: "HDR10; HDMI 2.0; HDCP 2.2" }, { name: "Downscaling", value: "4K-to-1080p per output" }, { name: "Control", value: "IR remote, buttons, RS-232 API" }],
  },
  {
    id: "avedio-matrix-4x2", asin: "B0B9YS9Z8G", brand: "avedio links", category: "hdmi-matrix",
    name: "avedio links 4x2 HDMI Matrix Switch (4K@60Hz, HDR)", price: 89.99, rating: 4.4,
    description: "The value and high-refresh pick: a 4-in, 2-out matrix under $100 that still does HDR10 and Dolby Vision at 4K@60Hz, plus gaming-friendly high refresh rates.",
    pros: ["Lowest price of the group while still doing 4K@60Hz 4:4:4, HDR10, and Dolby Vision", "High-refresh support gamers value: 1080p@144Hz/120Hz, 1440p@120Hz", "4K-to-1080p scaler drives a 4K and a 1080p display at once", "Highest rating and largest review count of the matrices here"],
    cons: ["Generic brand with limited long-term support versus OREI, TESmart, or AV Access", "Only IR remote and buttons; no RS-232 or IP control", "Only two outputs (4x2), so not a 4-display solution"],
    specs: [{ name: "Configuration", value: "4x2 (4 in, 2 out) true matrix" }, { name: "Max resolution", value: "4K@60Hz 4:4:4; 1080p@144Hz; 18Gbps" }, { name: "HDR / HDCP", value: "HDR10, HLG, Dolby Vision; HDMI 2.0b; HDCP 2.2" }, { name: "Downscaling", value: "4K-to-1080p scaler" }, { name: "Control", value: "IR remote and front buttons" }],
  },
];

const kvmBody = `A KVM switch lets you run two or more computers from one keyboard, mouse, and monitor. The name stands for Keyboard, Video, Mouse, and that is exactly what it shares: you plug each computer into the switch, plug your peripherals into the switch's outputs, and flip control between machines with a button, a hotkey, or a remote. Only one computer is active at a time, while the others keep running in the background.

If a work laptop and a personal desktop are fighting for space on one desk, or you want a Windows PC and a Mac on the same screens, an HDMI KVM switch clears the clutter of duplicate keyboards, mice, and monitors. Below we explain how these switches work, what to look for, and the five we would actually buy, ranked using real owner feedback.

## How a KVM Switch Works

Each computer connects to the switch with two cables: an HDMI cable for video and a USB cable for the keyboard and mouse. Your real peripherals (monitor or monitors, keyboard, mouse, and usually an audio jack and a couple of spare USB ports) plug into the switch's single set of outputs. Internally the switch routes one computer's video to your monitor and connects your keyboard and mouse to that same computer, so the active machine behaves as if those devices were plugged straight into it.

You change which computer is active with a front-panel button, a keyboard hotkey, the bundled remote, or on some models a flick of the mouse to the screen edge. A well-designed KVM also handles EDID, the data a monitor sends to tell a computer what resolutions it supports. With EDID emulation the switch keeps reporting the display to every computer even when it is not selected, so an idle machine does not think the monitor was unplugged. That single feature is the difference between a clean handoff and your icons and windows getting rearranged after every switch.

:::callout{type="info" title="KVM switch vs splitter, switch, and matrix"}
A KVM switch hands off video plus your keyboard, mouse, and USB so you control several computers from one set of gear. A plain HDMI switch only picks which video source shows on one screen (no keyboard or mouse). An HDMI splitter sends one source to several screens at once. An HDMI matrix routes many sources to many displays independently. Only a KVM actually controls computers.
:::

## What to Look For

- **Single vs dual monitor:** a dual-monitor model carries two video streams per computer and switches both screens together. Buy dual only if your workflow already uses two displays.
- **Real resolution:** "4K" alone is not enough. Many cheap units do 4K at only 30Hz, which feels sluggish on a desktop. Look for 4K at 60Hz with 4:4:4 color for crisp text.
- **EDID emulation:** the biggest predictor of a frustration-free experience. Good EDID handling prevents black screens and stops Windows from reshuffling your layout after each switch.
- **USB version:** a keyboard and mouse only need USB 2.0, but a fast drive, a 4K webcam, or a capture card wants USB 3.0 (5Gbps or better) on the hub ports.
- **Switching methods and audio:** confirm it offers the buttons, hotkeys, or remote you will actually use, and a dedicated 3.5mm audio output if you want speakers or a headset to follow the active computer.

## The Best HDMI KVM Switches

### Best Overall: UGREEN Dual-Monitor 4K KVM

::product-card{id="ugreen-kvm-2monitor"}

This is the rare dual-monitor 4K@60Hz KVM that bundles everything in the box: four HDMI cables, two USB cables, a power adapter, and a desktop switch controller, all at a mainstream price. Owners consistently praise the sharp 4K output across both screens, the fast USB 3.0 file transfer, and the convenient remote button. The main knock is that UGREEN's HDMI units lack full EDID emulation, so some users see windows rearrange or a brief black screen on switch. For a self-contained two-PC, two-monitor desk it remains the best balance of price, completeness, and popularity.

:::pros-cons
pros:
- True dual-monitor 4K@60Hz for two computers
- Every cable, the power adapter, and a desktop controller included
- 4 USB 3.0 ports at 5Gbps for full peripheral sharing

cons:
- No full EDID emulation, so windows can rearrange on switch
- Some owners report a delay re-detecting 4K displays
- Four HDMI runs make for real cable clutter
:::

### Best for Reliability: TESmart 4K KVM with EDID

::product-card{id="tesmart-kvm-edid"}

TESmart is the brand reviewers and roundups repeatedly cite for stability, and this single-monitor 4K@60Hz model is its value sweet spot. The standout is per-input EDID emulation, which keeps idle PCs seeing the monitor so your desktop icons and window layouts do not scramble on switch, the exact failure mode buyers complain about on cheaper HDMI KVMs. It also adds USB 3.0, discrete audio plus a microphone jack, and IR, hotkey, and button switching. It costs more than no-name units, but for everyday work-and-personal switching it is the most dependable pick here.

:::pros-cons
pros:
- Per-input EDID emulation keeps your window layout intact
- Reputation for stable, snappy switching
- USB 3.0 hub plus separate audio and microphone jacks

cons:
- Costs more than generic HDMI KVMs
- Single monitor only
- A few owners report audio or mic quirks
:::

### Best Dual-Monitor: CKL 922HUA-3

::product-card{id="ckl-kvm-922hua3"}

CKL is a dedicated KVM maker, and the 922HUA-3 is its proven dual-monitor 4K@60Hz workhorse with one of the deepest review pools in the category. It drives two 4K@60Hz displays in true extended mode, adds two extra USB 3.0 hub ports, and includes audio and all cables. Buyers like the responsive CKL support and the reliable extended-desktop behavior. The recurring complaints are occasional audio dropouts and sensitivity to cheap or long HDMI cables, so use the included cables and keep runs short.

:::pros-cons
pros:
- Dual 4K@60Hz extended or mirrored display
- From a specialist KVM brand with a very large review base
- Two extra USB 3.0 hub ports plus audio

cons:
- Some owners report audio dropouts or monitor cutouts
- Sensitive to cheap or long HDMI cables
- Mixed quality control on a minority of units
:::

### Best Value: UGREEN Single-Monitor 4K KVM

::product-card{id="ugreen-kvm-1monitor"}

This is UGREEN's high-volume single-monitor seller and the one most often recommended for a simple two-PC, one-monitor desk. It supports 4K@60Hz with 1440p@120Hz and 1080p@240Hz fallbacks, includes four USB 3.0 ports, and ships with both a one-button switch and a wired desktop controller. Owners love how it collapses two boxes into one tidy unit at a low price. Like other HDMI UGREEN units it lacks strong EDID emulation, so a brief black screen or window reshuffle on switch is the trade-off for the price.

:::pros-cons
pros:
- 4K@60Hz with high-refresh fallbacks for one shared monitor
- Four USB 3.0 ports at 5Gbps
- One-button switch and a wired desktop controller included

cons:
- Limited EDID emulation can rearrange windows on switch
- Some owners report a brief black screen re-detecting 4K
- Single monitor only
:::

### Best Budget: UGREEN Complete 4K KVM Kit

::product-card{id="ugreen-kvm-budget"}

The cheapest fully-equipped pick here, this UGREEN single-monitor 4K@60Hz switch undercuts most competitors while still bundling two HDMI cables, two USB cables, a power adapter, and a desktop controller, so there is nothing extra to buy. It carries the same 4K@60Hz HDMI 2.0 support and four USB 3.0 ports as pricier UGREEN units. Owners call it an easy, no-driver way to run a personal and a work PC on one screen. As with all HDMI UGREEN models, expect occasional window reshuffling on switch.

:::pros-cons
pros:
- Lowest price while still including cables, power adapter, and controller
- 4K@60Hz HDMI 2.0 with a 1440p@120Hz fallback
- Four USB 3.0 ports at 5Gbps

cons:
- Lacks robust EDID emulation
- Smaller review base than UGREEN's flagship single-monitor unit
- Single monitor only
:::

## How They Compare

| Model | Best for | Monitors | Max resolution | EDID | Price |
|-------|----------|----------|----------------|------|-------|
| UGREEN Dual-Monitor | Complete dual-4K desk | 2 | 4K@60Hz | No | ~$130 |
| TESmart EDID | Frequent switching | 1 | 4K@60Hz | Yes | ~$90 |
| CKL 922HUA-3 | Extended dual displays | 2 | 4K@60Hz | Partial | ~$160 |
| UGREEN Single-Monitor | Simple two-PC desk | 1 | 4K@60Hz | Limited | ~$70 |
| UGREEN Budget Kit | Tight budget | 1 | 4K@60Hz | Limited | ~$60 |

## How We Picked

We weighed real 4K@60Hz support, switching stability and EDID handling, USB hub speed, value, and owner ratings across the most-reviewed HDMI KVM switches. We leaned hardest on EDID and switching reliability, because those are the issues real buyers complain about most.

## The Bottom Line

For most people, the :product[UGREEN dual-monitor KVM]{id="ugreen-kvm-2monitor"} is the best all-around pick: it is complete in the box and handles two 4K screens. If you switch many times a day and hate seeing your windows rearrange, spend a little less and get the :product[TESmart with EDID emulation]{id="tesmart-kvm-edid"} instead. On a tight budget, the :product[UGREEN complete kit]{id="ugreen-kvm-budget"} covers the basics for under $60.`;

const hdmiBody = `An HDMI matrix switch connects several HDMI sources (game consoles, streaming boxes, cable boxes, PCs) to several displays and lets you route any input to any output, independently and at the same time. The naming is always inputs by outputs: a 4x2 matrix has 4 source inputs and 2 displays, a 4x4 has 4 of each. The key word is independently. Output 1 can show the PS5 while output 2 shows the cable box, and you can change either one without disturbing the other.

That makes a matrix the right tool when you have multiple sources and multiple screens that each need their own picture: a home theater plus a bedroom TV, a sports bar with several screens, or a conference room feeding two projectors. Below we explain how a matrix works, what to look for, and the five we would buy, ranked from real owner feedback.

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

### Best for Wired Control: TESmart 4x4

::product-card{id="tesmart-matrix-4x4"}

TESmart's 4x4 is the reliability and control workhorse: dependable 4K@60Hz 4:4:4 routing with control via front keypad, IR, RS-232, and IP commands, plus power-down memory that restores the last routing. Forum users repeatedly call it solid plug-and-play hardware. It ranks here rather than higher because it lacks the per-output 4K-to-1080p downscaler and user-selectable EDID menu that the OREI and AV Access offer, which matters if you mix a 1080p and a 4K display.

:::pros-cons
pros:
- Reliable, true plug-and-play 4x4 routing
- 4K@60Hz 4:4:4, HDMI 2.0, HDCP 2.2
- Control via keypad, IR, RS-232, and IP/LAN
- Audio output on each port; power-down memory

cons:
- No built-in 4K-to-1080p downscaler
- No user-selectable EDID menu
- Front-panel LEDs are very bright
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
| TESmart 4x4 | Wired control | 4x4 | No | RS-232, IP | ~$240 |
| AV Access 4KMX42 | Two displays | 4x2 | Yes | IR, RS-232 | ~$159 |
| avedio links 4x2 | Budget and gaming | 4x2 | Yes | IR only | ~$90 |

## How We Picked

We compared true independent routing, 4K@60Hz, HDR, and HDCP completeness, EDID and downscaling behavior, control options, and owner ratings across the most-recommended 4x4 and 4x2 matrices, confirming a real Amazon listing for every pick.

## The Bottom Line

For most home theaters, the :product[OREI UHD-404R]{id="orei-uhd404r"} is the best all-around 4x4: it routes four sources to four displays and downscales per output so a 1080p TV does not hold back your 4K screens. If you only have two displays, the :product[AV Access 4KMX42-H2A]{id="avaccess-4kmx42"} does the same job for less, and the :product[avedio links 4x2]{id="avedio-matrix-4x2"} covers a budget or gaming setup for under $100.`;

const kvmFaq = [
  { q: "Do I need two HDMI cables per computer for a dual-monitor KVM switch?", a: "Yes. Each monitor needs its own video signal, so a dual-monitor model uses two HDMI cables from each computer plus one USB cable for the keyboard and mouse. For two computers and two monitors that is four HDMI cables into the switch and two out to your displays. Single-monitor KVMs need just one HDMI cable per computer, and many switches include the cables." },
  { q: "Why does my switch say 4K but text and motion look bad?", a: "Almost always because it is doing 4K at only 30Hz, or outputting reduced color instead of full 4:4:4. 4K at 30Hz makes the cursor and scrolling feel laggy on a desktop, and reduced color smears small text. For a comfortable desktop, buy a switch explicitly rated 4K 60Hz with 4:4:4. For high-refresh gaming you need an HDMI 2.1 model rated for 4K 120Hz or higher." },
  { q: "After I switch computers, my icons and windows get rearranged. How do I stop that?", a: "That happens when an inactive computer briefly loses the monitor during switching and re-detects it at a different resolution, reshuffling your layout. The fix is EDID emulation: a switch with good EDID handling keeps reporting the display to every computer even when it is not active, so nothing thinks the monitor was unplugged. Choose a model known for solid EDID, like the TESmart pick above." },
  { q: "Will my speakers, webcam, and external drive switch over too?", a: "Only if the switch supports it. For audio, look for a dedicated 3.5mm output, since HDMI-embedded audio may otherwise go only to the monitor speakers. For a webcam or drive, plug it into the switch's USB hub ports, and check the USB version: a keyboard and mouse run fine on USB 2.0, but a 4K webcam or fast SSD wants USB 3.0 (5Gbps or better)." },
  { q: "Can a KVM switch a Windows PC and a Mac, or a laptop that only has USB-C?", a: "Yes to mixing operating systems. The switch does not care whether the computer is Windows, macOS, or Linux; you just hotkey between them. For a laptop with only USB-C video, either use a USB-C-to-HDMI adapter into a standard HDMI KVM, or buy a KVM with native USB-C inputs (some also charge the laptop over the same cable)." },
  { q: "Does a KVM switch add input lag or hurt gaming?", a: "A quality KVM adds negligible lag, typically well under a millisecond, because it passes the signal through rather than re-processing it. The real limit is bandwidth: a cheap switch may cap you at 4K 60Hz or strip VRR and HDR. For competitive or high-refresh play, choose an HDMI 2.1 KVM rated for the resolution and refresh you want, and note the switch only affects the currently active computer." },
];

const hdmiFaq = [
  { q: "What does 4x2 or 4x4 actually mean?", a: "It is inputs by outputs. A 4x2 matrix accepts 4 HDMI sources and feeds 2 displays; a 4x4 feeds 4 displays. The first number is how many source devices you can plug in, the second is how many screens you can drive. Count your real sources and displays before buying, and leave a little headroom since you cannot expand the port count later." },
  { q: "Can each TV really show something different at the same time?", a: "Yes, that is the entire point of a matrix versus a splitter. Each output is routed independently, so display 1 can show your console while display 2 shows cable, and you can change either one without affecting the other. A splitter, by contrast, forces every screen to show the identical source." },
  { q: "Do I need an HDMI 2.1 matrix, or is 2.0 (18Gbps) enough?", a: "For standard 4K at 60Hz HDR video (streaming, Blu-ray, most home theater), an 18Gbps HDMI 2.0 matrix is enough and cheaper. You only need an HDMI 2.1, 40 to 48Gbps matrix if you are driving 4K at 120Hz or 8K, or want gaming features like VRR from a PS5, Xbox Series X, or gaming PC. Match it to your actual sources and displays rather than buying 2.1 just in case." },
  { q: "Why do I get a black screen, no signal, or no Dolby Vision through my matrix?", a: "Almost always an EDID or HDCP issue. If a source cannot read a valid EDID it may output nothing or the wrong resolution; switching the matrix's EDID mode usually fixes it. Black screens on protected 4K content point to HDCP, so the unit needs HDCP 2.2. Missing HDR or Dolby Vision means the matrix does not pass that specific format. Power-cycling the whole chain after changes also helps the handshake settle." },
  { q: "Will a matrix downscale 4K so my old 1080p TV still works alongside a 4K TV?", a: "Only if it has independent per-output scaling, so look for that feature explicitly. With it, the output feeding the old TV converts 4K to 1080p while the 4K TV still gets native 4K. Without it, plugging in one 1080p display can drag every output down to 1080p, because EDID negotiates to the lowest common capability. The OREI and AV Access picks above include per-output downscaling." },
  { q: "Can I run the displays in different rooms across the house?", a: "Plain HDMI outputs are only reliable to roughly 15 to 25 feet, so for whole-home distribution choose a matrix with HDBaseT or HDMI-over-Cat6 outputs that send signal to a small receiver box at each remote TV. For shorter in-room runs, active or fiber-optic HDMI cables can stretch standard outputs. Do not expect a basic matrix with bare HDMI ports to feed a TV three rooms away." },
];

const posts = [
  {
    id: "what-is-a-kvm-switch", slug: "what-is-a-kvm-switch", type: "roundup", category: "guides",
    title: "What Is a KVM Switch? How It Works and the Best Ones in 2026",
    dek: "A KVM switch runs two or more computers from one keyboard, mouse, and monitor. Here is how they work, what to look for, and the five best HDMI KVM switches.",
    seoTitle: "What Is a KVM Switch? Guide + Best Picks (2026)",
    seoDescription: "What a KVM switch is, how it works, and the 5 best HDMI KVM switches in 2026, ranked from real owner reviews for dual-monitor, single-monitor, and budget setups.",
    body: kvmBody,
    structured: {
      criteria: ["4K@60Hz video", "EDID and switching stability", "USB hub speed", "Value", "Owner ratings"],
      howWeChose: "We weighed real 4K@60Hz support, switching stability and EDID handling, USB hub speed, value, and owner ratings across the most-reviewed HDMI KVM switches, leaning hardest on the issues real buyers complain about most.",
      picks: [
        { rank: 1, productId: "ugreen-kvm-2monitor", award: "Best Overall", bestFor: "a complete dual-monitor 4K desk", rationale: "The rare dual-monitor 4K KVM that comes complete in the box, with the best balance of price, completeness, and popularity." },
        { rank: 2, productId: "tesmart-kvm-edid", award: "Best for Reliability", bestFor: "frequent switching without window scramble", rationale: "Per-input EDID emulation keeps your window layout intact, the exact failure mode buyers complain about on cheaper switches." },
        { rank: 3, productId: "ckl-kvm-922hua3", award: "Best Dual-Monitor", bestFor: "extended dual 4K displays", rationale: "A specialist brand's proven dual-monitor workhorse with a deep review pool and reliable extended-desktop switching." },
        { rank: 4, productId: "ugreen-kvm-1monitor", award: "Best Value", bestFor: "a simple two-PC, one-monitor desk", rationale: "UGREEN's high-volume single-monitor seller: tidy, affordable, and the most-recommended basic two-PC switch." },
        { rank: 5, productId: "ugreen-kvm-budget", award: "Best Budget", bestFor: "a complete kit on a tight budget", rationale: "The cheapest fully-equipped pick, bundling cables, power adapter, and controller for under $60." },
      ],
      faq: kvmFaq,
    },
    tags: [["kvm-switch", "KVM Switch"], ["hdmi", "HDMI"], ["peripherals", "Peripherals"], ["buying-guide", "Buying Guide"]],
    products: ["ugreen-kvm-2monitor", "tesmart-kvm-edid", "ckl-kvm-922hua3", "ugreen-kvm-1monitor", "ugreen-kvm-budget"],
  },
  {
    id: "what-does-an-hdmi-matrix-do", slug: "what-does-an-hdmi-matrix-do", type: "roundup", category: "guides",
    title: "What Does an HDMI Matrix Do? How It Works and the Best HDMI Matrix Switches in 2026",
    dek: "An HDMI matrix routes several sources to several displays independently. Here is how it works, what to look for, and the five best HDMI matrix switches.",
    seoTitle: "What Does an HDMI Matrix Do? Best Picks 2026",
    seoDescription: "What an HDMI matrix does, how it differs from a splitter or switch, and the 5 best HDMI matrix switches in 2026, ranked from real reviews for 4x4 and 4x2 setups.",
    body: hdmiBody,
    structured: {
      criteria: ["Independent routing", "4K@60Hz, HDR, HDCP", "Per-output downscaling", "Control options", "Owner ratings"],
      howWeChose: "We compared true independent routing, 4K@60Hz, HDR, and HDCP completeness, EDID and downscaling behavior, control options, and owner ratings across the most-recommended 4x4 and 4x2 matrices, confirming a real Amazon listing for every pick.",
      picks: [
        { rank: 1, productId: "orei-uhd404r", award: "Best Overall", bestFor: "an all-around 4-display home theater", rationale: "The most complete consumer 4x4: full 4K@60Hz 4:4:4 with a 4K-to-1080p downscaler on every output." },
        { rank: 2, productId: "avaccess-4kmx44", award: "Best for Installers", bestFor: "browser and RS-232 control", rationale: "A 4x4 with Web UI, a documented RS-232 API, and power-off memory, the most flexible box for automation." },
        { rank: 3, productId: "tesmart-matrix-4x4", award: "Best for Wired Control", bestFor: "rock-solid keypad, RS-232, and IP control", rationale: "Dependable plug-and-play 4x4 routing with the broadest wired control suite, minus a per-output downscaler." },
        { rank: 4, productId: "avaccess-4kmx42", award: "Best Dual-Display", bestFor: "two displays with audio breakout", rationale: "The standout 4x2: four HDR sources to two outputs with per-output downscaling, for far less than a 4x4." },
        { rank: 5, productId: "avedio-matrix-4x2", award: "Best Budget and Gaming", bestFor: "a budget or high-refresh home setup", rationale: "Under $100 with HDR10, Dolby Vision, high refresh rates, and a 4K-to-1080p scaler; the highest-rated matrix here." },
      ],
      faq: hdmiFaq,
    },
    tags: [["hdmi-matrix", "HDMI Matrix"], ["hdmi", "HDMI"], ["home-theater", "Home Theater"], ["buying-guide", "Buying Guide"]],
    products: ["orei-uhd404r", "avaccess-4kmx44", "tesmart-matrix-4x4", "avaccess-4kmx42", "avedio-matrix-4x2"],
  },
];

const out = [];
out.push("-- seed-kvm-hdmi: 10 verified Amazon products + 2 ranked guides. Generated " + NOW);

for (const p of products) {
  out.push(
    `INSERT INTO products (id, name, brand, category, price_cents, currency, price_source, rating, description, pros_json, cons_json, specs_json, created_at, updated_at) VALUES (${q(p.id)}, ${q(p.name)}, ${q(p.brand)}, ${q(p.category)}, ${n(cents(p.price))}, 'USD', 'manual', ${n(p.rating)}, ${q(p.description)}, ${json(p.pros)}, ${json(p.cons)}, ${json(specsObj(p.specs))}, ${q(NOW)}, ${q(NOW)});`,
  );
  out.push(
    `INSERT INTO product_links (id, product_id, affiliate_profile_id, base_url, is_primary, created_at, updated_at) VALUES (${q("pl-" + p.id + "-amazon")}, ${q(p.id)}, 'amazon-main', ${q(dp(p.asin))}, 1, ${q(NOW)}, ${q(NOW)});`,
  );
}

for (const post of posts) {
  out.push(
    `INSERT INTO content (id, type, status, slug, title, dek, category, author_id, verdict_score, body_md, structured_json, seo_title, seo_description, published_at, created_at, updated_at) VALUES (${q(post.id)}, ${q(post.type)}, 'published', ${q(post.slug)}, ${q(post.title)}, ${q(post.dek)}, ${q(post.category)}, 'alex', NULL, ${q(post.body)}, ${json(post.structured)}, ${q(post.seoTitle)}, ${q(post.seoDescription)}, ${q(NOW)}, ${q(NOW)}, ${q(NOW)});`,
  );
  out.push(
    `INSERT INTO content_affiliate_profiles (content_id, affiliate_profile_id) VALUES (${q(post.id)}, 'amazon-main');`,
  );
  post.products.forEach((pid, i) => {
    out.push(
      `INSERT INTO content_products (content_id, product_id, role, position, affiliate_profile_id) VALUES (${q(post.id)}, ${q(pid)}, ${i === 0 ? "'primary'" : "'featured'"}, ${i}, 'amazon-main');`,
    );
  });
  for (const [slug, name] of post.tags) {
    out.push(`INSERT OR IGNORE INTO tags (slug, name) VALUES (${q(slug)}, ${q(name)});`);
    out.push(`INSERT INTO content_tags (content_id, tag_slug) VALUES (${q(post.id)}, ${q(slug)});`);
  }
}

console.log(out.join("\n"));
