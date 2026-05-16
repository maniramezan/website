export const profile = {
  name: "Mani Ramezan",
  subtitle: "iOS engineer · testing, architecture, automation",
  role: "Staff iOS Engineer",
  location: "Brooklyn, NY",
  email: "mani.ramezan@gmail.com",
  summary:
    "Staff iOS Engineer with 12+ years building mobile applications at LinkedIn and Amazon.",
  shortBio:
    "My current work centers on modular iOS architecture, rigorous testing strategies, and smoothing out day-to-day developer workflows.",
  links: {
    linkedin: "https://www.linkedin.com/in/maniramezan/",
    github: "https://github.com/maniramezan",
    speakerDeck: "https://speakerdeck.com/maniramezan",
    twitter: "https://x.com/maniramezan",
    bluesky: "https://bsky.app/profile/maniramezan.bsky.social",
    mastodon: "https://mastodon.social/@maanmaan",
    medium: "http://medium.com/@maniramezan",
    blogsRepo: "https://github.com/maniramezan/blogs"
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

export const openSourceProjects = [
  {
    name: "ShipItSwifty",
    description:
      "Swift-native CLI and library for iOS and Android app release automation. Automates the build → archive → distribute pipeline from a single declarative Shipfile.yml, with first-class support for App Store Connect, Google Play, code signing, metadata, and AI-assisted setup.",
    language: "Swift",
    stars: null,
    url: "https://github.com/ShipItSwifty/shipitswifty"
  },
  {
    name: "SwiftyShell",
    description:
      "Type-safe shell support for Swift. Models shell tools, subcommands, flags, pipelines, and workflows as Swift values — compiler-enforced, testable via MockExecutor, with typed wrappers for Git, Grep, Brew, and more.",
    language: "Swift",
    stars: null,
    url: "https://github.com/maniramezan/SwiftyShell"
  },
  {
    name: "SwiftyChain",
    description:
      "Swift 6 keychain wrapper for Apple platforms. Provides a typed Keychain actor for async-safe access and an @KeychainStorage property wrapper for simple optional values.",
    language: "Swift",
    stars: null,
    url: "https://github.com/maniramezan/SwiftyChain"
  },
  {
    name: "UserDefaultMacro",
    description:
      "Swift macros that reduce boilerplate when working with UserDefaults-backed storage.",
    language: "Swift",
    stars: 5,
    url: "https://github.com/maniramezan/UserDefaultMacro"
  }
];

export const resumeExperience = [
  {
    title: "Staff Software Engineer",
    company: "LinkedIn",
    period: "Jun 2021 – Feb 2025",
    notes: [
      "Led greenfield fullstack project across frontend and backend teams, architecting gRPC backend services and building POCs to enable cross-team adoption.",
      "Led a new app deep-linking initiative that unblocked an estimated $24M in revenue.",
      "Improved developer experience through testing infrastructure improvements, compiler plugins, architectural migrations, and modernizing LayoutTest-iOS APIs.",
      "Led the Sponsored Messaging mobile team (both iOS and Android), mentoring engineers and conducting iOS workshops for new hires."
    ]
  },
  {
    title: "Mobile SDE II",
    company: "Comixology (Amazon)",
    period: "Nov 2019 – Jun 2021",
    notes: [
      "Consolidated the Comixology codebase with Amazon platforms.",
      "Designed and implemented a Swift framework to migrate legacy code.",
      "Refactored release automation scripts, reducing release time by 30%.",
      "Created a troubleshooting wiki adopted by 40+ engineers across three teams."
    ]
  },
  {
    title: "Senior Mobile Engineer",
    company: "Zocdoc",
    period: "Sep 2017 – Nov 2019",
    notes: [
      "Led product ideation and implementation of iMessage and Siri integrations.",
      "Upgraded the dependency manager and modularized code, reducing compile time by 21%.",
      "Consolidated app targets (4 → 1) and refactored codebase, eliminating ~200 compile-time warnings."
    ]
  },
  {
    title: "Mobile Engineer",
    company: "Venuenext",
    period: "Sep 2015 – Sep 2017",
    notes: [
      "Onboarded six Fortune 500 customers into custom-label apps.",
      "Implemented ticketing systems on iOS and Android.",
      "Automated build processes, reducing build times by 45% per platform."
    ]
  },
  {
    title: "Associate SW Engineer",
    company: "Pearson",
    period: "Sep 2013 – Sep 2015",
    notes: [
      "Collaborated with 35+ engineers across multiple teams to build cross-platform apps with Xamarin SDK.",
      "Implemented a conflict resolution screen to support user content syncing on both iOS native and Xamarin."
    ]
  },
  {
    title: "Senior Expert of Architecture and Infrastructures",
    company: "Chargoon",
    location: "Tehran, Iran",
    period: "Feb 2008 – Jun 2011",
    notes: [
      "Designed and delivered enterprise software architecture and infrastructure solutions for large-scale business applications."
    ]
  }
];

export const resumeSkillGroups = [
  { label: "Languages", skills: ["Swift", "Objective-C", "Kotlin", "Java", "SQL", "JavaScript", "TypeScript"] },
  { label: "AI Dev Tools", skills: ["GitHub Copilot", "Claude Code", "Windsurf", "Codex", "MCP", "AI Agents"] },
  { label: "iOS & Mobile", skills: ["iOS SDK", "UIKit", "SwiftUI", "Combine", "CoreData", "Swift Concurrency", "React Native", "Android SDK"] },
  { label: "Backend & Cloud", skills: ["gRPC", "GraphQL", "AWS Amplify", "AppSync", "DynamoDB", "Trino"] },
  { label: "CI/CD & DevOps", skills: ["GitHub Actions", "CircleCI", "Bitrise", "Xcode Cloud", "Fastlane", "Shell Scripting"] },
  { label: "Testing", skills: ["XCTest", "UI Automation", "Snapshot Testing", "JUnit"] }
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
    degree: "Bachelor of Computer Engineering",
    school: "Islamic Azad University of Tehran North Branch",
    location: "Tehran, Iran",
    period: "Sept 2005 – Feb 2011"
  }
];
