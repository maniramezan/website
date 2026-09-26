export const profile = {
  name: "Mani Ramezan",
  role: "Founder, Arjang Consulting",
  location: "Brooklyn, NY",
  email: "mani@arjangconsulting.com",
  shortBio:
    "Founder of Arjang Consulting and tech lead for a mobile team at Capital One. I spend my time on mobile architecture, developer tooling, test automation, and making AI-assisted development actually pay off on a real team.",
  links: {
    linkedin: "https://www.linkedin.com/in/maniramezan",
    github: "https://github.com/maniramezan",
    speakerDeck: "https://speakerdeck.com/maniramezan",
    twitter: "https://x.com/maniramezan",
    bluesky: "https://bsky.app/profile/maniramezan.bsky.social",
    mastodon: "https://mastodon.social/@maanmaan",
    medium: "http://medium.com/@maniramezan"
  }
};

export const socials = [
  { id: "linkedin", label: "LinkedIn", url: profile.links.linkedin },
  { id: "github", label: "GitHub", url: profile.links.github },
  { id: "twitter", label: "Twitter / X", url: profile.links.twitter },
  { id: "bluesky", label: "Bluesky", url: profile.links.bluesky },
  { id: "mastodon", label: "Mastodon", url: profile.links.mastodon },
  { id: "speakerDeck", label: "Speaker Deck", url: profile.links.speakerDeck }
];

export const highlights = [
  "Architecting maintainable, modular codebases for iOS applications",
  "Speaking about practical testing strategies and modern Xcode tooling",
  "Writing guides based on real-world engineering challenges, not just theory"
];

// Add new talks at the TOP of this array — they are sorted newest-first by year.
// youtube: "VIDEO_ID"  — the part after ?v= (enables embedded player)
// youtubeStart: SECONDS — optional; seek to this timestamp in the embed
// kodecoUrl: "URL"      — links to Kodeco video page when available
export const talks = [
  {
    title: "iOSoho: WWDC 2025 Lightning Talks",
    description: "Lightning talk covering the highlights and most impactful announcements from WWDC 2025 for iOS developers.",
    tag: "Tooling",
    tagColor: "rose",
    venue: "iOSoho",
    year: 2025,
    youtube: "q31uzuyQuK8",
    youtubeStart: 2452,
    speakerDeckId: null,
    url: null
  },
  {
    title: "iOSoho 2025: What's New in Xcode",
    description: "Exploring the latest Xcode features and testing enhancements available for iOS developers.",
    tag: "Tooling",
    tagColor: "rose",
    venue: "iOSoho",
    year: 2025,
    youtube: null,
    speakerDeckId: "bb5cb938059648499ca1316c40fe7b1f",
    url: "https://speakerdeck.com/maniramezan/iosoho-2025-whats-new-in-xcode-exploring-latest-features-and-testing-enhancements"
  },
  {
    title: "Enhancing Swift Development Through Modularization and Automation",
    description: "How modular design and automation improve delivery velocity across iOS teams.",
    tag: "Architecture",
    tagColor: "lilac",
    venue: "iOSoho",
    year: 2024,
    youtube: "E5J_9M3EQVY",
    youtubeStart: 1931,
    speakerDeckId: "a7d80619c8e74182aead5397a62189ce",
    url: "https://speakerdeck.com/maniramezan/enhancing-swift-development-through-modularization-and-automation"
  },
  {
    title: "Writing Reliable Tests in iOS",
    description: "Testing strategies for long-term maintainability — avoiding brittle assertions and designing test suites that scale.",
    tag: "Testing",
    tagColor: "sage",
    venue: "Kodeco",
    year: 2023,
    youtube: null,
    kodecoUrl: "https://www.kodeco.com/10528490-mani-ramezan-writing-reliable-tests-in-ios",
    speakerDeckId: "710853d6c1de45a1a78ecb2a04361cc2",
    url: "https://speakerdeck.com/maniramezan/writing-reliable-tests-in-ios"
  },
  {
    title: "Tips and Tricks to Write Reliable Tests",
    description: "Tactical testing improvements for iOS teams — practical techniques you can adopt immediately.",
    tag: "Testing",
    tagColor: "sage",
    venue: "iOSoho",
    year: 2022,
    youtube: null,
    speakerDeckId: "981c421c03d0440fa34d9a655252a922",
    url: "https://speakerdeck.com/maniramezan/tips-and-tricks-to-write-reliable-tests"
  },
  {
    title: "CI for Projects Sharing Code",
    description: "Continuous integration patterns for shared mobile codebases and multi-team iOS projects.",
    tag: "Tooling",
    tagColor: "rose",
    venue: "iOSoho",
    year: 2021,
    youtube: null,
    speakerDeckId: "45610d4d5e2340a7af1c5c7d0a9bda43",
    url: "https://speakerdeck.com/maniramezan/ci-for-projects-sharing-code"
  }
];

// Grouped by organization so the resume stays scannable: each group carries a
// one-line summary, and expanding the section reveals the individual repositories.
export const openSourceGroups = [
  {
    id: "shipitswifty",
    name: "ShipItSwifty",
    url: "https://github.com/ShipItSwifty",
    description:
      "Swift-native release automation for iOS and Android. A single declarative Shipfile drives the build → archive → distribute pipeline, and dedicated MCP servers put App Store Connect, Xcode Cloud, and Google Play release state in reach of AI agents.",
    projects: [
      {
        name: "shipitswifty",
        description:
          "The CLI and library behind the pipeline, covering code signing, metadata, and App Store Connect / Google Play submission.",
        url: "https://github.com/ShipItSwifty/shipitswifty"
      },
      {
        name: "app-store-connect-mcp",
        description:
          "App Store Connect and Xcode Cloud Swift client, plus an MCP server for investigating CI failures with AI agents.",
        url: "https://github.com/ShipItSwifty/app-store-connect-mcp"
      },
      {
        name: "google-play-store-mcp",
        description:
          "Swift clients for Google service-account auth and the Play Developer API, plus an MCP server exposing Play release state to AI agents.",
        url: "https://github.com/ShipItSwifty/google-play-store-mcp"
      }
    ]
  },
  {
    id: "arjang",
    name: "Arjang Consulting",
    url: "https://github.com/ArjangConsulting",
    description:
      "Test and mock infrastructure for native mobile, built to be driven as comfortably by AI agents as by hand.",
    projects: [
      {
        name: "amoo-ai",
        description:
          "Drives iOS and Android devices and simulators to author and run automated tests, including an MCP server for AI agents.",
        url: "https://github.com/ArjangConsulting/amoo-ai"
      },
      {
        name: "amoo-studio",
        description: "Kotlin Multiplatform desktop GUI for the amoo tooling.",
        url: "https://github.com/ArjangConsulting/amoo-studio"
      },
      {
        name: "moqserver",
        description:
          "Mock server generator with a Swift Vapor backend and a desktop app to customize API responses.",
        url: "https://github.com/ArjangConsulting/moqserver"
      }
    ]
  },
  {
    id: "personal",
    name: "Personal libraries",
    url: "https://github.com/maniramezan",
    description:
      "Swift and Kotlin libraries I maintain and lean on in my own work — shell scripting, keychain, networking, and shared UI components.",
    projects: [
      {
        name: "SwiftyShell",
        description:
          "Type-safe shell support for Swift. Models tools, subcommands, flags, pipelines, and workflows as Swift values — compiler-enforced and testable via MockExecutor, with typed wrappers for Git, Grep, Brew, and more.",
        url: "https://github.com/maniramezan/SwiftyShell"
      },
      {
        name: "SwiftyChain",
        description:
          "Swift 6 keychain wrapper for Apple platforms. A typed Keychain actor for async-safe access and an @KeychainStorage property wrapper for simple optional values.",
        url: "https://github.com/maniramezan/SwiftyChain"
      },
      {
        name: "SwiftyNetwork",
        description:
          "Modern Swift networking library with async/await, built-in caching, authentication, and type-safe endpoints.",
        url: "https://github.com/maniramezan/SwiftyNetwork"
      },
      {
        name: "SwiftUIComponents",
        description: "Reusable custom components for SwiftUI apps.",
        url: "https://github.com/maniramezan/SwiftUIComponents"
      },
      {
        name: "SwiftCommons",
        description: "Shared Swift utilities and helpers for reusable app code.",
        url: "https://github.com/maniramezan/SwiftCommons"
      },
      {
        name: "UserDefaultMacro",
        description:
          "Swift macros that reduce boilerplate when working with UserDefaults-backed storage.",
        url: "https://github.com/maniramezan/UserDefaultMacro"
      },
      {
        name: "ComposeUIComponents",
        description: "Reusable UI components for Kotlin and Android Compose projects.",
        url: "https://github.com/maniramezan/ComposeUIComponents"
      },
      {
        name: "kenwork",
        description: "Android networking library with caching and authentication support.",
        url: "https://github.com/maniramezan/kenwork"
      },
      {
        name: "kommon",
        description:
          "Kotlin-first library of helper methods focused on Android features and shared utilities.",
        url: "https://github.com/maniramezan/kommon"
      }
    ]
  }
];

export const podcasts = [
  {
    title: "How to Read Code",
    publisher: "Kodeco",
    year: 2025,
    url: "https://www.kodeco.com/46567685-kodeco-podcast-how-to-read-code-podcast-v2-s3-e1"
  }
];

export const resumeExperience = [
  {
    title: "Tech Lead",
    company: "Capital One",
    companyUrl: "https://www.capitalone.com",
    period: "Feb 2026 – Present",
    notes: [
      "Lead a mobile team of four engineers, collaborating across backend, product, and engineering teams on feature scoping, technical design, and code quality.",
      "Coordinate and drive AOC Accept across multiple teams, expanding mobile adoption by transitioning customer experiences from web to the native mobile app.",
      "Reduced flaky tests and manual regression testing by ~90% on iOS and ~85% on Android through improvements to mobile test automation.",
      "Drive adoption of AI-assisted development across the team through tooling, agentic workflows, and hands-on training."
    ]
  },
  {
    title: "Founder",
    company: "Arjang Consulting",
    companyUrl: "https://arjang.consulting",
    period: "May 2023 – Present",
    notes: [
      "Operate a technical consultancy focused on mobile CI/CD, test automation, developer tooling, and open-source software.",
      "Develop and maintain [Jot: Habit Tracker & Calendar](https://apps.apple.com/us/app/jot-habit-tracker-calendar/id6779810169), a privacy-focused consumer app with extensive customization.",
      "Build and maintain open-source developer tooling, including [ShipItSwifty](https://github.com/ShipItSwifty) for mobile release automation, [amoo-ai](https://github.com/arjangconsulting/amoo-ai) for AI-assisted native mobile testing, and [moqserver](https://github.com/arjangconsulting/moqserver) for UI test infrastructure.",
      "Extend developer tooling with Model Context Protocol (MCP) integrations, enabling AI agents to automate workflows across the [App Store](https://github.com/ShipItSwifty/app-store-connect-mcp) and [Google Play](https://github.com/ShipItSwifty/google-play-store-mcp)."
    ]
  },
  {
    title: "Staff Software Engineer",
    company: "LinkedIn",
    period: "Jun 2021 – Feb 2026",
    notes: [
      "Led a greenfield project across frontend and backend teams, architecting gRPC services and building prototypes to validate the architecture and drive cross-team adoption.",
      "Led a new app deep-linking initiative that unblocked an estimated $24M in revenue.",
      "Improved mobile developer experience through testing infrastructure, compiler tooling, architectural migrations, and modernization of [LayoutTest-iOS](https://github.com/linkedin/LayoutTest-iOS).",
      "Led the Sponsored Messaging mobile team across iOS and Android, mentoring engineers and conducting iOS workshops for new hires."
    ]
  },
  {
    title: "Mobile SDE II",
    company: "Comixology (Amazon)",
    period: "Nov 2019 – Jun 2021",
    notes: [
      "Integrated Comixology features and business logic into the Amazon Kindle codebase, designing a Swift framework to enable a Swift-first approach within the existing Objective-C codebase.",
      "Refactored release automation, reducing release time by 30%.",
      "Created a troubleshooting knowledge base adopted by 40+ engineers across three teams.",
      "Interviewed, onboarded, and mentored engineers."
    ]
  },
  {
    title: "Senior Mobile Engineer",
    company: "Zocdoc",
    period: "Sep 2017 – Nov 2019",
    notes: [
      "Led product ideation and implementation of iMessage and Siri integrations.",
      "Modernized the iOS architecture and dependency management, reducing compile time by 21%.",
      "Consolidated four app targets into one and refactored the codebase, eliminating ~200 compile-time warnings."
    ]
  },
  {
    title: "Mobile Engineer",
    company: "VenueNext",
    period: "Sep 2015 – Sep 2017",
    notes: [
      "Developed iOS and Android features for a server-driven UI platform supporting white-label applications for six Fortune 500 customers.",
      "Built CI/CD pipelines to automate builds and releases for ~18 white-label iOS and Android apps, reducing build times by 45% per platform.",
      "Collaborated with Product, Design, and an offshore engineering team on feature development, roadmap priorities, and cross-time-zone delivery."
    ]
  },
  {
    title: "Associate Software Engineer",
    company: "Pearson",
    period: "Sep 2013 – Sep 2015",
    notes: [
      "Collaborated with 35+ engineers across multiple teams to develop cross-platform mobile applications using Xamarin.",
      "Served as team lead for support and feature teams, coordinating delivery of new functionality and production fixes.",
      "Implemented cross-platform conflict resolution for user content synchronization across native iOS and Xamarin."
    ]
  },
  {
    title: "Senior Expert of Architecture and Infrastructures",
    company: "Chargoon",
    period: "Feb 2008 – Jun 2011",
    notes: [
      "Developed full-stack enterprise applications and system integrations using .NET, MS SQL, and WCF."
    ]
  }
];

export const resumeSkillGroups = [
  { label: "Languages", skills: ["Swift", "Objective-C", "Kotlin", "Java", "JavaScript", "TypeScript", "SQL"] },
  { label: "Mobile", skills: ["iOS", "UIKit", "SwiftUI", "Swift Concurrency", "Android", "React Native"] },
  { label: "AI & Developer Tooling", skills: ["AI Agents", "Model Context Protocol (MCP)", "AI-Assisted Development"] },
  { label: "Backend & Cloud", skills: ["gRPC", "GraphQL", "Firebase", "Google Cloud", "AWS"] },
  { label: "CI/CD & Testing", skills: ["GitHub Actions", "CircleCI", "Bitrise", "Xcode Cloud", "Fastlane", "XCTest", "UI Automation", "Snapshot Testing"] }
];

export const resumeEducation = [
  {
    degree: "Master of Science, Computer Science",
    concentration: "Software Engineering",
    school: "University of Texas at San Antonio",
    location: "San Antonio, TX",
    period: "Aug 2011 – Aug 2013"
  },
  {
    degree: "Bachelor of Science, Computer Engineering",
    school: "Islamic Azad University, Tehran North Branch",
    location: "Tehran, Iran",
    period: "Sept 2005 – Feb 2011"
  }
];
