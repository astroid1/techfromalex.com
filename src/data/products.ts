import type { Product } from "@/types";

export const products: Record<string, Product> = {
  "macbook-pro-m4": {
    id: "macbook-pro-m4",
    name: "MacBook Pro 14\" M4",
    brand: "Apple",
    category: "laptops",
    image: "/images/products/macbook-pro-m4.svg",
    price: 1599,
    rating: 4.7,
    description:
      "Apple's latest MacBook Pro with the M4 chip delivers blazing-fast performance, an incredible Liquid Retina XDR display, and all-day battery life in a sleek, portable design.",
    pros: [
      "Exceptional single-core and multi-core performance",
      "Up to 24 hours of battery life",
      "Stunning Liquid Retina XDR display",
      "Quiet fanless operation under light loads",
    ],
    cons: [
      "Starting price is steep for most users",
      "Only 16GB unified memory in base model",
      "No touchscreen option",
    ],
    specs: {
      Processor: "Apple M4 (10-core CPU, 10-core GPU)",
      Memory: "16GB unified memory",
      Storage: "512GB SSD",
      Display: "14.2\" Liquid Retina XDR, 3024x1964",
      Battery: "Up to 24 hours",
      Weight: "3.4 lbs (1.55 kg)",
    },
    links: [
      {
        program: "amazon",
        url: "https://www.amazon.com/Apple-MacBook-Laptop-14-inch-Processor/dp/B0DLHBYZNL",
      },
      {
        program: "bestbuy",
        url: "https://www.bestbuy.com/site/apple-macbook-pro-14-inch-m4-chip-16gb-memory-512gb/6601851.p",
      },
      {
        program: "bhphoto",
        url: "https://www.bhphotovideo.com/c/product/1849153-REG/apple_mbp14_m4_sl_14_macbook_pro_laptop.html",
      },
    ],
  },
  "sony-wh1000xm5": {
    id: "sony-wh1000xm5",
    name: "Sony WH-1000XM5",
    brand: "Sony",
    category: "headphones",
    image: "/images/products/sony-wh1000xm5.svg",
    price: 348,
    rating: 4.6,
    description:
      "Industry-leading noise canceling headphones with Auto NC Optimizer, exceptional sound quality, and up to 30 hours of battery life.",
    pros: [
      "Best-in-class active noise cancellation",
      "Excellent sound quality with LDAC support",
      "30-hour battery life",
      "Lightweight and comfortable for long sessions",
    ],
    cons: [
      "No folding design like predecessor",
      "Premium price point",
      "Touch controls can be accidentally triggered",
    ],
    specs: {
      Driver: "30mm carbon fiber composite",
      "Noise Canceling": "Dual Processor, 8 microphones",
      Battery: "30 hours (NC on)",
      Connectivity: "Bluetooth 5.2, 3.5mm",
      Weight: "250g",
      Codec: "LDAC, AAC, SBC",
    },
    links: [
      {
        program: "amazon",
        url: "https://www.amazon.com/Sony-WH-1000XM5-Canceling-Headphones-Hands-Free/dp/B09XS7JWHH",
      },
      {
        program: "bestbuy",
        url: "https://www.bestbuy.com/site/sony-wh-1000xm5-wireless-noise-canceling/6505727.p",
      },
      {
        program: "bhphoto",
        url: "https://www.bhphotovideo.com/c/product/1705570-REG/sony_wh1000xm5_b_wh_1000xm5_wireless_noise_canceling.html",
      },
    ],
  },
  "samsung-t7-ssd": {
    id: "samsung-t7-ssd",
    name: "Samsung T7 Portable SSD (1TB)",
    brand: "Samsung",
    category: "storage",
    image: "/images/products/samsung-t7-ssd.svg",
    price: 99,
    rating: 4.8,
    description:
      "Fast, reliable portable SSD with USB 3.2 Gen 2 speeds up to 1,050 MB/s. Compact enough to fit in your palm with built-in hardware encryption.",
    pros: [
      "Blazing read/write speeds up to 1,050/1,000 MB/s",
      "Extremely compact and lightweight",
      "Built-in AES 256-bit hardware encryption",
      "Shock-resistant with no moving parts",
    ],
    cons: [
      "Gets warm under sustained transfers",
      "USB-C to USB-A cable sold separately",
      "No IP rating for water/dust resistance",
    ],
    specs: {
      Capacity: "1TB",
      Interface: "USB 3.2 Gen 2 (10Gbps)",
      "Sequential Read": "Up to 1,050 MB/s",
      "Sequential Write": "Up to 1,000 MB/s",
      Dimensions: "85 x 57 x 8.0 mm",
      Weight: "58g",
    },
    links: [
      {
        program: "amazon",
        url: "https://www.amazon.com/SAMSUNG-Portable-SSD-1TB-MU-PC1T0T/dp/B0874XN4D8",
      },
      {
        program: "bestbuy",
        url: "https://www.bestbuy.com/site/samsung-t7-1tb-external-usb-3-2-gen-2-portable-ssd/6405012.p",
      },
    ],
  },
  "logitech-mx-master-3s": {
    id: "logitech-mx-master-3s",
    name: "Logitech MX Master 3S",
    brand: "Logitech",
    category: "peripherals",
    image: "/images/products/logitech-mx-master-3s.svg",
    price: 99,
    rating: 4.7,
    description:
      "Premium wireless mouse with an ergonomic design, MagSpeed scroll wheel, and 8K DPI tracking on virtually any surface, including glass.",
    pros: [
      "MagSpeed electromagnetic scroll is incredibly precise",
      "Tracks on any surface including glass",
      "Connect up to 3 devices with Easy-Switch",
      "USB-C fast charging (1 min = 3 hrs use)",
    ],
    cons: [
      "Expensive for a mouse",
      "Right-handed design only",
      "Bluetooth can lag on some systems",
    ],
    specs: {
      Sensor: "Darkfield 8000 DPI",
      Battery: "Up to 70 days on full charge",
      Connectivity: "Bluetooth, Logi Bolt USB receiver",
      "Scroll Wheel": "MagSpeed electromagnetic",
      Weight: "141g",
      Compatibility: "Windows, macOS, Linux, iPadOS",
    },
    links: [
      {
        program: "amazon",
        url: "https://www.amazon.com/Logitech-MX-Master-3S-Graphite/dp/B09HM94VDS",
      },
      {
        program: "bestbuy",
        url: "https://www.bestbuy.com/site/logitech-mx-master-3s-wireless-laser-mouse/6502100.p",
      },
      {
        program: "bhphoto",
        url: "https://www.bhphotovideo.com/c/product/1706491-REG/logitech_910_006556_mx_master_3s_wireless.html",
      },
    ],
  },
  "ipad-air-m2": {
    id: "ipad-air-m2",
    name: "Apple iPad Air (M2)",
    brand: "Apple",
    category: "tablets",
    image: "/images/products/ipad-air-m2.svg",
    price: 599,
    rating: 4.5,
    description:
      "The iPad Air with M2 chip offers powerful performance in a thin, lightweight design. Features a 10.9\" Liquid Retina display, Wi-Fi 6E, and support for Apple Pencil Pro.",
    pros: [
      "M2 chip handles demanding apps with ease",
      "Gorgeous Liquid Retina display",
      "Apple Pencil Pro support",
      "Lightweight at under a pound",
    ],
    cons: [
      "60Hz refresh rate (no ProMotion)",
      "Front camera in landscape only on 13-inch",
      "Base model has only 128GB storage",
    ],
    specs: {
      Processor: "Apple M2",
      Display: "10.9\" Liquid Retina, 2360x1640",
      Storage: "128GB",
      Camera: "12MP Wide rear, 12MP Ultra Wide front",
      Battery: "Up to 10 hours",
      Weight: "1.02 lbs (462g)",
    },
    links: [
      {
        program: "amazon",
        url: "https://www.amazon.com/Apple-iPad-Air-11-inch-Landscape/dp/B0D3J7GPRX",
      },
      {
        program: "bestbuy",
        url: "https://www.bestbuy.com/site/apple-ipad-air-11-inch-m2-chip-128gb/5495362.p",
      },
    ],
  },
  "asus-rog-ally-x": {
    id: "asus-rog-ally-x",
    name: "ASUS ROG Ally X",
    brand: "ASUS",
    category: "gaming",
    image: "/images/products/asus-rog-ally-x.svg",
    price: 799,
    rating: 4.3,
    description:
      "A powerful Windows gaming handheld featuring an AMD Ryzen Z1 Extreme processor, 7-inch 120Hz FHD display, and 80Wh battery for extended portable gaming sessions.",
    pros: [
      "Excellent performance with Ryzen Z1 Extreme",
      "Full Windows 11 for native PC game library",
      "120Hz FHD IPS display is vibrant",
      "80Wh battery is a big upgrade over original",
    ],
    cons: [
      "Fan noise under heavy load",
      "Windows UI is not ideal for handheld use",
      "Heavier than Nintendo Switch OLED",
    ],
    specs: {
      Processor: "AMD Ryzen Z1 Extreme",
      Memory: "24GB LPDDR5X",
      Storage: "1TB PCIe 4.0 SSD",
      Display: "7\" FHD IPS, 120Hz, 1080p",
      Battery: "80Wh",
      Weight: "678g",
    },
    links: [
      {
        program: "amazon",
        url: "https://www.amazon.com/ASUS-ROG-Ally-Gaming-Handheld/dp/B0D56LCZ2J",
      },
      {
        program: "bestbuy",
        url: "https://www.bestbuy.com/site/asus-rog-ally-x-7-120hz-fhd-1080p-gaming-handheld/6583218.p",
      },
      {
        program: "bhphoto",
        url: "https://www.bhphotovideo.com/c/product/1862570-REG/asus_rc71l_nh015w_rog_ally_x.html",
      },
    ],
  },
};
