export const profile = {
  name: "Mani Ramezan",
  role: "iOS Engineer",
  summary:
    "I build reliable products on Apple platforms, document practical engineering patterns, and help mobile teams ship with confidence.",
  shortBio:
    "My current work centers on modular iOS architecture, rigorous testing strategies, and smoothing out day-to-day developer workflows.",
  links: {
    linkedin: "https://www.linkedin.com/in/maniramezan/",
    github: "https://github.com/maniramezan",
    speakerDeck: "https://speakerdeck.com/maniramezan",
    twitter: "https://x.com/maniramezan",
    bluesky: "https://bsky.app/profile/maniramezan.bsky.social",
    mastodon: "https://mastodon.social/@maniramezan",
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

export const talks = [
  {
    title: "iOSoho 2025: What's New in Xcode",
    description: "Exploring the latest features and testing enhancements.",
    url: "https://speakerdeck.com/maniramezan/iosoho-2025-whats-new-in-xcode-exploring-latest-features-and-testing-enhancements"
  },
  {
    title: "Enhancing Swift Development Through Modularization and Automation",
    description: "How modular design and automation improve delivery velocity.",
    url: "https://speakerdeck.com/maniramezan/enhancing-swift-development-through-modularization-and-automation"
  },
  {
    title: "Writing Reliable Tests in iOS",
    description: "Testing strategies for long-term maintainability.",
    url: "https://speakerdeck.com/maniramezan/writing-reliable-tests-in-ios"
  },
  {
    title: "Tips and Tricks to Write Reliable Tests",
    description: "Tactical testing improvements for iOS teams.",
    url: "https://speakerdeck.com/maniramezan/tips-and-tricks-to-write-reliable-tests"
  },
  {
    title: "CI for Projects Sharing Code",
    description: "Continuous integration patterns for shared mobile codebases.",
    url: "https://speakerdeck.com/maniramezan/ci-for-projects-sharing-code"
  }
];

export const openSourceProjects = [
  {
    name: "UserDefaultMacro",
    description:
      "Swift macros that reduce boilerplate when working with UserDefaults-backed storage.",
    language: "Swift",
    stars: 5,
    url: "https://github.com/maniramezan/UserDefaultMacro"
  }
];
