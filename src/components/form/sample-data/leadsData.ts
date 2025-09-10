// Sample leads data for development and testing
// Replace with actual API calls in production

export interface ILead {
  LeadID: string;
  LeadFullName: string;
  Email?: string;
  Phone?: string;
}

export const leadsData: ILead[] = [
  { LeadID: "L001", LeadFullName: "John Doe", Email: "john.doe@example.com", Phone: "+1-555-0101" },
  { LeadID: "L002", LeadFullName: "Jane Smith", Email: "jane.smith@example.com", Phone: "+1-555-0102" },
  { LeadID: "L003", LeadFullName: "Bob Johnson", Email: "bob.johnson@example.com", Phone: "+1-555-0103" },
  { LeadID: "L004", LeadFullName: "Alice Brown", Email: "alice.brown@example.com", Phone: "+1-555-0104" },
  { LeadID: "L005", LeadFullName: "Charlie Wilson", Email: "charlie.wilson@example.com", Phone: "+1-555-0105" },
  { LeadID: "L006", LeadFullName: "Diana Martinez", Email: "diana.martinez@example.com", Phone: "+1-555-0106" },
  { LeadID: "L007", LeadFullName: "Edward Davis", Email: "edward.davis@example.com", Phone: "+1-555-0107" },
  { LeadID: "L008", LeadFullName: "Fiona Garcia", Email: "fiona.garcia@example.com", Phone: "+1-555-0108" },
  { LeadID: "L009", LeadFullName: "George Miller", Email: "george.miller@example.com", Phone: "+1-555-0109" },
  { LeadID: "L010", LeadFullName: "Hannah Rodriguez", Email: "hannah.rodriguez@example.com", Phone: "+1-555-0110" },
  { LeadID: "L011", LeadFullName: "Ian Thompson", Email: "ian.thompson@example.com", Phone: "+1-555-0111" },
  { LeadID: "L012", LeadFullName: "Julia Anderson", Email: "julia.anderson@example.com", Phone: "+1-555-0112" },
  { LeadID: "L013", LeadFullName: "Kevin Taylor", Email: "kevin.taylor@example.com", Phone: "+1-555-0113" },
  { LeadID: "L014", LeadFullName: "Linda Moore", Email: "linda.moore@example.com", Phone: "+1-555-0114" },
  { LeadID: "L015", LeadFullName: "Michael Jackson", Email: "michael.jackson@example.com", Phone: "+1-555-0115" },
  { LeadID: "L016", LeadFullName: "Nancy White", Email: "nancy.white@example.com", Phone: "+1-555-0116" },
  { LeadID: "L017", LeadFullName: "Oscar Lee", Email: "oscar.lee@example.com", Phone: "+1-555-0117" },
  { LeadID: "L018", LeadFullName: "Patricia Harris", Email: "patricia.harris@example.com", Phone: "+1-555-0118" },
  { LeadID: "L019", LeadFullName: "Quincy Clark", Email: "quincy.clark@example.com", Phone: "+1-555-0119" },
  { LeadID: "L020", LeadFullName: "Rachel Lewis", Email: "rachel.lewis@example.com", Phone: "+1-555-0120" },
  { LeadID: "L021", LeadFullName: "Samuel Walker", Email: "samuel.walker@example.com", Phone: "+1-555-0121" },
];
