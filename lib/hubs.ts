export interface Hub {
  slug: string;
  name: string;
  country: string;
  group: "United States" | "United Kingdom" | "Canada" | "Australia" | "India";
}

export const HUBS: Hub[] = [
  { slug: "new-york-city", name: "New York City", country: "United States", group: "United States" },
  { slug: "los-angeles", name: "Los Angeles", country: "United States", group: "United States" },
  { slug: "seattle", name: "Seattle", country: "United States", group: "United States" },
  { slug: "chicago", name: "Chicago", country: "United States", group: "United States" },
  { slug: "london", name: "London", country: "United Kingdom", group: "United Kingdom" },
  { slug: "manchester", name: "Manchester", country: "United Kingdom", group: "United Kingdom" },
  { slug: "birmingham", name: "Birmingham", country: "United Kingdom", group: "United Kingdom" },
  { slug: "toronto", name: "Toronto", country: "Canada", group: "Canada" },
  { slug: "vancouver", name: "Vancouver", country: "Canada", group: "Canada" },
  { slug: "sydney", name: "Sydney", country: "Australia", group: "Australia" },
  { slug: "melbourne", name: "Melbourne", country: "Australia", group: "Australia" },
  { slug: "mumbai", name: "Mumbai", country: "India", group: "India" },
  { slug: "delhi", name: "Delhi", country: "India", group: "India" },
  { slug: "bengaluru", name: "Bengaluru", country: "India", group: "India" },
  { slug: "hyderabad", name: "Hyderabad", country: "India", group: "India" },
];

export const FEATURED_STADIUMS = [
  { slug: "lords", name: "Lord's", query: "Lord's Cricket Ground" },
  { slug: "yankee-stadium", name: "Yankee Stadium", query: "Yankee Stadium" },
  { slug: "chinnaswamy-stadium", name: "Chinnaswamy Stadium", query: "M. Chinnaswamy Stadium" },
];

export const HUB_GROUPS = ["United States", "United Kingdom", "Canada", "Australia", "India"] as const;
