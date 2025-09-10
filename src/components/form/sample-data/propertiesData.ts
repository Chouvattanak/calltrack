// Sample properties data for development and testing
// Replace with actual API calls in production

export interface IProperty {
  PropertyID: string;
  PropertyName: string;
  Location?: string;
  PropertyType?: string;
  Price?: string;
  Status?: string;
}

export const propertiesData: IProperty[] = [
  { PropertyID: "P001", PropertyName: "Sunrise Villa", Location: "Downtown", PropertyType: "Villa", Price: "$850,000", Status: "Available" },
  { PropertyID: "P002", PropertyName: "Ocean View Condo", Location: "Beachfront", PropertyType: "Condominium", Price: "$650,000", Status: "Available" },
  { PropertyID: "P003", PropertyName: "Mountain Lodge", Location: "Hillside", PropertyType: "Lodge", Price: "$1,200,000", Status: "Reserved" },
  { PropertyID: "P004", PropertyName: "City Apartment", Location: "Central Business District", PropertyType: "Apartment", Price: "$450,000", Status: "Available" },
  { PropertyID: "P005", PropertyName: "Garden House", Location: "Suburban", PropertyType: "House", Price: "$750,000", Status: "Available" },
  { PropertyID: "P006", PropertyName: "Luxury Penthouse", Location: "Uptown", PropertyType: "Penthouse", Price: "$2,500,000", Status: "Sold" },
  { PropertyID: "P007", PropertyName: "Cozy Cottage", Location: "Countryside", PropertyType: "Cottage", Price: "$380,000", Status: "Available" },
  { PropertyID: "P008", PropertyName: "Modern Townhouse", Location: "New Development", PropertyType: "Townhouse", Price: "$920,000", Status: "Available" },
  { PropertyID: "P009", PropertyName: "Beachfront Studio", Location: "Coastal Area", PropertyType: "Studio", Price: "$320,000", Status: "Available" },
  { PropertyID: "P010", PropertyName: "Executive Suite", Location: "Financial District", PropertyType: "Apartment", Price: "$680,000", Status: "Reserved" },
  { PropertyID: "P011", PropertyName: "Family Residence", Location: "Residential Area", PropertyType: "House", Price: "$590,000", Status: "Available" },
  { PropertyID: "P012", PropertyName: "Historic Manor", Location: "Old Town", PropertyType: "Manor", Price: "$1,800,000", Status: "Available" },
  { PropertyID: "P013", PropertyName: "Lakeside Cabin", Location: "Lake District", PropertyType: "Cabin", Price: "$420,000", Status: "Sold" },
  { PropertyID: "P014", PropertyName: "Urban Loft", Location: "Arts District", PropertyType: "Loft", Price: "$540,000", Status: "Available" },
  { PropertyID: "P015", PropertyName: "Suburban Villa", Location: "Quiet Neighborhood", PropertyType: "Villa", Price: "$780,000", Status: "Available" },
  { PropertyID: "P016", PropertyName: "Riverside Apartment", Location: "Riverfront", PropertyType: "Apartment", Price: "$495,000", Status: "Reserved" },
  { PropertyID: "P017", PropertyName: "Country Estate", Location: "Rural Area", PropertyType: "Estate", Price: "$2,200,000", Status: "Available" },
  { PropertyID: "P018", PropertyName: "City Center Flat", Location: "City Center", PropertyType: "Flat", Price: "$385,000", Status: "Available" },
  { PropertyID: "P019", PropertyName: "Hillside Retreat", Location: "Mountain View", PropertyType: "House", Price: "$640,000", Status: "Sold" },
  { PropertyID: "P020", PropertyName: "Marina Condo", Location: "Harbor District", PropertyType: "Condominium", Price: "$720,000", Status: "Available" },
  { PropertyID: "P021", PropertyName: "Garden Apartment", Location: "Green Valley", PropertyType: "Apartment", Price: "$460,000", Status: "Available" },
  { PropertyID: "P022", PropertyName: "Designer Penthouse", Location: "Luxury District", PropertyType: "Penthouse", Price: "$3,100,000", Status: "Reserved" },
];
