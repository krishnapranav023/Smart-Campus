import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const COLLEGES = [
  { name: "IIT Bombay", code: "IITB", location: "Mumbai, Maharashtra" },
  { name: "IIT Delhi", code: "IITD", location: "New Delhi, Delhi" },
  { name: "IIT Madras", code: "IITM", location: "Chennai, Tamil Nadu" },
  { name: "IIT Kanpur", code: "IITK", location: "Kanpur, Uttar Pradesh" },
  { name: "IIT Kharagpur", code: "IITKGP", location: "Kharagpur, West Bengal" },
  { name: "IIT Roorkee", code: "IITR", location: "Roorkee, Uttarakhand" },
  { name: "NIT Trichy", code: "NITT", location: "Tiruchirappalli, Tamil Nadu" },
  { name: "NIT Surathkal", code: "NITK", location: "Surathkal, Karnataka" },
  { name: "NIT Warangal", code: "NITW", location: "Warangal, Telangana" },
  { name: "BITS Pilani", code: "BITS", location: "Pilani, Rajasthan" },
  { name: "Delhi Technological University", code: "DTU", location: "New Delhi, Delhi" },
  { name: "Vellore Institute of Technology", code: "VIT", location: "Vellore, Tamil Nadu" },
  { name: "SRM University", code: "SRM", location: "Chennai, Tamil Nadu" },
  { name: "Anna University", code: "AU", location: "Chennai, Tamil Nadu" },
  { name: "Jadavpur University", code: "JU", location: "Kolkata, West Bengal" },
  { name: "Manipal Institute of Technology", code: "MIT", location: "Manipal, Karnataka" },
  { name: "Amrita Vishwa Vidyapeetham", code: "AMRITA", location: "Coimbatore, Tamil Nadu" },
  { name: "PSG College of Technology", code: "PSG", location: "Coimbatore, Tamil Nadu" },
  { name: "Thapar University", code: "THAPAR", location: "Patiala, Punjab" },
  { name: "COEP Technological University", code: "COEP", location: "Pune, Maharashtra" },
  { name: "VJTI Mumbai", code: "VJTI", location: "Mumbai, Maharashtra" },
  { name: "RV College of Engineering", code: "RVCE", location: "Bangalore, Karnataka" },
  { name: "PES University", code: "PESU", location: "Bangalore, Karnataka" },
  { name: "Amity University", code: "AMITY", location: "Noida, Uttar Pradesh" },
  { name: "Shiv Nadar University", code: "SNU", location: "Greater Noida, Uttar Pradesh" },
  { name: "SASTRA University", code: "SASTRA", location: "Thanjavur, Tamil Nadu" },
  { name: "MSRIT", code: "MSRIT", location: "Bangalore, Karnataka" },
  { name: "KIIT Bhubaneswar", code: "KIIT", location: "Bhubaneswar, Odisha" },
  { name: "Christ University", code: "CHRIST", location: "Bangalore, Karnataka" },
  { name: "SSN College of Engineering", code: "SSN", location: "Chennai, Tamil Nadu" },
  { name: "Loyola College", code: "LOYOLA", location: "Chennai, Tamil Nadu" },
  { name: "KCT Coimbatore", code: "KCT", location: "Coimbatore, Tamil Nadu" },
  { name: "Saveetha University", code: "SAVEETHA", location: "Chennai, Tamil Nadu" },
  { name: "Sathyabama University", code: "SATHYABAMA", location: "Chennai, Tamil Nadu" },
  { name: "SCSVMV University", code: "SCSVMV", location: "Kanchipuram, Tamil Nadu" }
];

const REAL_EVENT_NAMES = {
  Technical: [
    "CodeWarriors Summit", "DevFest India", "HackathonX", "TechMastery Challenge",
    "AI Innovation Expo", "WebDeveloper Championship", "Cybersecurity Bootcamp", "IoT Revolution",
    "Machine Learning Workshop", "Cloud Computing Challenge", "Data Science Olympiad", "Blockchain Symposium",
    "Full Stack Developer Wars", "API Design Challenge", "DevOps Mastery", "System Design Bootcamp"
  ],
  Cultural: [
    "Literaria", "Spandan - Dance Fiesta", "Ninaad - Music Festival", "Art Spectrum",
    "Cultural Carnival", "Heritage Showcase", "Drama Fest", "Poetry Night Extravaganza",
    "Folk Festival", "Painting Competition", "Sculpture Exhibition", "Theater Symposium",
    "Harmony Concert", "Dance Marathon", "Artistic Expression", "Cultural Confluence"
  ],
  Sports: [
    "InterCollege Marathon", "Cricket Championship", "Football Tournament", "Badminton League",
    "Basketball Slam Dunk", "Volleyball Showdown", "Table Tennis Masters", "Athletic Meet",
    "Swimming Gala", "Tennis Championship", "Kabaddi Cup", "Archery Competition",
    "Lawn Tennis Open", "Basketball Pro League", "Running Championship", "Sports Carnival"
  ],
  Management: [
    "Business Case Study", "Entrepreneurship Summit", "Marketing Challenge", "Leadership Conference",
    "Finance Quiz Master", "HR Conclave", "Supply Chain Simulation", "Investment Banking Bootcamp",
    "Startup Pitch Night", "Business Strategy Game", "Corporate Quiz", "Management Olympiad",
    "Biztech Challenge", "Consulting Case Competition", "Sales Championship", "Negotiation League"
  ],
  Literary: [
    "Essay Writing Championship", "Debate Competition", "Quiz Bowl National", "Story Telling Fest",
    "Creative Writing Workshop", "Public Speaking Challenge", "Article Writing Contest", "Poem Recitation",
    "Book Review Summit", "Writing Marathon", "Speech Festival", "Literature Olympiad",
    "Rhetoric Showdown", "Storytelling Gala", "Creative Expression Forum", "Writing Excellence"
  ],
  Arts: [
    "Contemporary Art Exhibition", "Photography Contest", "Digital Art Showcase", "Canvas Painting Competition",
    "Sculpture Park Exhibition", "Mixed Media Art Fest", "Street Art Challenge", "Installation Art Showcase",
    "Art Auction Gala", "Artist Residency Program", "Art Therapy Workshop", "Creative Arts Festival",
    "Visual Arts Olympiad", "Graphic Design Championship", "Illustration Competition", "Art Expo"
  ],
  Academic: [
    "Research Symposium", "Academic Excellence Awards", "Paper Presentation Conference", "Thesis Showcase",
    "Research Collaboration Summit", "Scientific Innovation Expo", "Academic Excellence Challenge", "Scholar's Conference",
    "Research Mentorship Program", "Academic Olympiad", "Knowledge Summit", "University Research Fair",
    "Innovation Research Fest", "Doctoral Colloquium", "Faculty Research Meet", "Academic Conclave"
  ],
  ESports: [
    "PUBG Mobile Tournament", "Valorant Nationals", "CS:GO Championship", "Dota 2 Invitational",
    "League of Legends Cup", "Fortnite Battle Royale", "FIFA Gaming League", "Fighting Game Tournament",
    "Minecraft Building Challenge", "Clash Royale Cup", "Mobile Gaming Fest", "Gaming Grand Finale",
    "Call of Duty Championship", "Apex Legends Cup", "Rocket League Tournament", "Esports Championship"
  ],
  Robotics: [
    "RoboWars", "Autonomous Robot Challenge", "Drone Racing Championship", "Robot Soccer Tournament",
    "Line Following Challenge", "Maze Solving Competition", "Humanoid Robot Showdown", "Robotic Arm Challenge",
    "Underwater Robotics", "Space Robotics Challenge", "Swarm Robotics Competition", "Robotics Innovation Expo",
    "Robocon", "Robot Navigation Challenge", "Robotics Olympics", "Future Robotics"
  ],
  Design: [
    "Graphic Design Championship", "UI/UX Design Challenge", "Furniture Design Competition", "Fashion Show",
    "Interior Design Summit", "Product Design Hackathon", "Web Design Competition", "Logo Design Contest",
    "Poster Making Championship", "Design Thinking Workshop", "Animation Competition", "Design Expo",
    "Industrial Design Challenge", "Fashion Week", "Design Innovation Summit", "Creative Design League"
  ],
  Innovation: [
    "InnovateTech Hackathon", "Startup Showcase", "Innovation Summit", "Patent Filing Workshop",
    "Green Innovation Challenge", "Health Tech Innovation", "EdTech Competition", "FinTech Challenge",
    "AgriTech Innovation", "SustainTech Expo", "Innovation Pitch", "Technology Showcase",
    "Future Innovation Forum", "Tech Startup Meet", "Innovation Conclave", "Ideathon Championship"
  ],
  Finance: [
    "Finance Quiz Championship", "Stock Market Simulation", "Investment Banking Case Study", "Financial Modeling Challenge",
    "Accounting Olympiad", "Taxation Challenge", "Business Valuation Competition", "Risk Management Summit",
    "Forex Trading Competition", "Crypto Finance Challenge", "Insurance Quiz", "Finance Festival",
    "Banking Championship", "Financial Analysis Competition", "Economics Olympiad", "Finance Conclave"
  ],
  "Social Service": [
    "Community Service Drive", "NGO Fair", "Environmental Cleanup Drive", "Health Awareness Camp",
    "Education Outreach Program", "Women Empowerment Summit", "Rural Development Initiative", "Disaster Relief Program",
    "Charity Marathon", "Blood Donation Camp", "Social Impact Challenge", "Community Building Workshop",
    "Social Entrepreneurship Forum", "Sustainability Initiative", "Community Excellence Program", "Social Change Summit"
  ]
};

const SPONSORS = ["TCS", "Infosys", "Wipro", "HCL", "Tech Mahindra", "Google", "Microsoft", "Amazon Web Services", "Flipkart", "Razorpay", "PhonePe", "Swiggy", "Zomato", "BYJU'S", "Unacademy", "Paytm", "Ola", "InMobi", "Freshworks", "Zoho"];
const EVENT_TYPES = Object.keys(REAL_EVENT_NAMES);

const FIRST_NAMES = [
  "Aarav", "Advait", "Arjun", "Aryan", "Ishaan", "Vihaan", "Ranveer", "Kabir", "Aditya", "Sai", 
  "Krishna", "Ram", "Dev", "Rohan", "Rahul", "Varun", "Amit", "Sanjay", "Anil", "Sunil", 
  "Vijay", "Rajesh", "Suresh", "Vikram", "Kartik", "Karan", "Abhishek", "Deepak", "Sandip", "Pankaj", 
  "Gaurav", "Manish", "Vivek", "Alok", "Harish", "Praveen", "Ashok", "Kiran", "Nikhil", "Pranav", 
  "Rajat", "Sameer", "Tushar", "Yash", "Aman", "Rishabh", "Shreyas", "Sid", "Madhav", "Raghav", 
  "Keshav", "Gopal", "Aakash", "Aniket", "Anupam", "Arpit", "Ashish", "Ayush", "Baldev", "Bhuvan", 
  "Chinmay", "Chirag", "Darshan", "Dhruv", "Dinesh", "Divyansh", "Harendra", "Himanshu", "Indrajeet", "Jagdish", 
  "Jitendra", "Kailash", "Lalit", "Mahesh", "Mayank", "Mohit", "Mukund", "Naman", "Naveen", "Nishant", 
  "Nitin", "Piyush", "Pradeep", "Puneet", "Rakesh", "Ritvik", "Rohit", "Sachin", "Saurabh", "Shivam", 
  "Shubham", "Siddharth", "Somesh", "Tarun", "Uday", "Utkarsh", "Vipul", "Vishal", "Yogesh", "Ananya", 
  "Diya", "Ira", "Kaveri", "Meera", "Sana", "Tanvi", "Zoya", "Myra", "Prisha", "Siya", 
  "Vanya", "Neha", "Priya", "Sneha", "Riya", "Aditi", "Pooja", "Shreya", "Kirti", "Komal", 
  "Swati", "Aishwarya", "Divya", "Kriti", "Megha", "Nisha", "Payal", "Ritu", "Sakshi", "Shalini", 
  "Sonali", "Tanushree", "Vaishnavi", "Yashasvi", "Aachal", "Aarti", "Akanksha", "Alka", "Amita", "Anjali", 
  "Ankita", "Anuradha", "Archana", "Asha", "Babita", "Barkha", "Bhawna", "Chhavi", "Deepa", "Deepti", 
  "Ekta", "Garima", "Geeta", "Gauri", "Gunjan", "Hema", "Indu", "Jyoti", "Kajal", "Kalpana", 
  "Kanchan", "Kavita", "Khushboo", "Lalita", "Madhu", "Mamta", "Manisha", "Manju", "Maya", "Monika", 
  "Namrata", "Nidhi", "Poonam", "Preeti", "Priyanka", "Radha", "Rajni", "Rashmi", "Rekha", "Renu", 
  "Rina", "Rupa", "Sandhya", "Sapna", "Sarita", "Seema", "Shweta", "Simran", "Sunita", "Sushma", 
  "Uma", "Vandana", "Varsha", "Veena", "Vidya"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Patel", "Shah", "Deshmukh", "Chauhan", "Pandey", 
  "Iyer", "Nair", "Reddy", "Choudhury", "Pillai", "Das", "Menon", "Joshi", "Bhatia", "Khanna", 
  "Rao", "Kumar", "Prasad", "Sinha", "Mishra", "Tripathi", "Dwivedi", "Trivedi", "Pathak", "Dubey", 
  "Shukla", "Awasthi", "Saxena", "Srivastava", "Sen", "Bose", "Chatterjee", "Mukherjee", "Banerjee", "Roy", 
  "Dutta", "Ghosh", "Kar", "Ray", "Majumdar", "Halder", "Sarkar", "Paul", "Dasgupta", "Sen-Gupta", 
  "Kulkarni", "Patil", "Deshpande", "Gaikwad", "Shinde", "More", "Pawar", "Bhosle", "Jadhav", "Shetty", 
  "Hegde", "Shenoy", "Kamath", "Pai", "Prabhu", "Naik", "Fernandes", "D'Souza", "Gomes"
];

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function generateName() { return `${getRandom(FIRST_NAMES)} ${getRandom(LAST_NAMES)}`; }

async function main() {
  console.log("🚀 Starting ULTIMATE SEEDING (2016-2026 with Real Event Names)...");
  const password = await bcrypt.hash("password123", 10);

  // Phase 1: Cleanup in reverse FK order
  console.log("🧹 Wiping database...");
  const models = [
    'notification', 'winner', 'registration', 'feedback', 
    'eventproposal', 'budget', 'sponsor', 'segment', 
    'eventcoordinator', 'media', 'eventtimeline', 
    'relationshiptracker', 'event', 'venue', 'user', 'institution'
  ];
  for (const model of models) { 
    try {
      await prisma[model].deleteMany({});
      console.log(` ✓ Cleaned ${model}`);
    } catch (e) {
      console.log(` - Skipped ${model}`);
    }
  }

  // Phase 2: Create Institutions
  console.log("🏫 Seeding 35 Institutions...");
  const institutions = await Promise.all(COLLEGES.map(c => 
    prisma.institution.create({ data: { ...c, updatedAt: new Date() } })
  ));
  console.log(`✓ Created ${institutions.length} institutions`);

  // Phase 3: Create Venues
  console.log("🏟️ Seeding Venues...");
  const venues = await Promise.all([...Array(15)].map((_, i) => 
    prisma.venue.create({ data: { name: `Campus Hall ${String.fromCharCode(65+i)}`, capacity: 200 + (i * 100), location: `Zone ${i+1}` } })
  ));
  console.log(`✓ Created ${venues.length} venues`);

  // Phase 4: Create Users
  console.log("👥 Seeding Users (Admin, Organizers per Institution)...");
  
  // Admin
  await prisma.user.create({ 
    data: { 
      name: "System Admin", 
      email: "krishnapranav2020@gmail.com", 
      password, 
      role: "ADMIN", 
      institutionId: institutions[34].id, 
      updatedAt: new Date() 
    } 
  });
  
  // Organizers (1 per institution)
  const organizers = await Promise.all(institutions.map(inst => 
    prisma.user.create({ 
      data: { 
        name: `${inst.code} Organizer`, 
        email: inst.code === "SCSVMV" ? "11229A023@kanchoiuniv.ac.in" : `organizer@${inst.code.toLowerCase()}.edu.in`, 
        password, 
        role: "ORGANIZER", 
        institutionId: inst.id, 
        updatedAt: new Date() 
      } 
    })
  ));
  console.log(`✓ Created ${organizers.length} organizers`);

  // Special Demo Organizer/Participant for Login.jsx sync
  await prisma.user.create({ 
    data: { 
      name: "SRM Organizer", 
      email: "organizer@srmist.edu.in", 
      password, 
      role: "ORGANIZER", 
      institutionId: institutions[12].id, 
      updatedAt: new Date() 
    } 
  });
  await prisma.user.create({ 
    data: { 
      name: "VIT Participant", 
      email: "krishnapranav2024@gmail.com", 
      password, 
      role: "PARTICIPANT", 
      institutionId: institutions[11].id, 
      updatedAt: new Date() 
    } 
  });

  // 1000 Participants
  console.log("🏃 Seeding 1000 Participants...");
  const participantsList = [];
  const firstNameCounts = {};
  const fullNameSet = new Set();
  
  for (let i = 0; i < 1000; i++) {
    let firstName = getRandom(FIRST_NAMES);
    let lastName = getRandom(LAST_NAMES);
    let name = `${firstName} ${lastName}`;
    let attempts = 0;

    // Regulate first name repeats to maximum 6 times, and ensure full name uniqueness
    while ((firstNameCounts[firstName] >= 6 || fullNameSet.has(name)) && attempts < 200) {
      firstName = getRandom(FIRST_NAMES);
      lastName = getRandom(LAST_NAMES);
      name = `${firstName} ${lastName}`;
      attempts++;
    }

    firstNameCounts[firstName] = (firstNameCounts[firstName] || 0) + 1;
    fullNameSet.add(name);

    participantsList.push({
      name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, "")}.${i}@gmail.com`,
      password,
      role: "PARTICIPANT",
      institutionId: getRandom(institutions).id,
      updatedAt: new Date()
    });
  }
  await prisma.user.createMany({ data: participantsList, skipDuplicates: true });
  const allParticipants = await prisma.user.findMany({ where: { role: "PARTICIPANT" } });
  console.log(`✓ Created ${allParticipants.length} participants`);

  // Phase 5: Create 500+ Events (2016-2026) - Starting from May
  console.log("📅 Seeding 500+ Events across 11 years (May-December)...");
  const allOrganizers = await prisma.user.findMany({ where: { role: "ORGANIZER" } });
  const eventIds = [];
  let eventCount = 0;
  
  for (let year = 2016; year <= 2026; year++) {
    let eventsPerYear;
    if (year === 2026) {
      eventsPerYear = 18;
    } else if (year < 2019) {
      eventsPerYear = Math.floor(10 + Math.random() * 20);
    } else if (year === 2020 || year === 2021) {
      eventsPerYear = Math.floor(2 + Math.random() * 8);
    } else {
      eventsPerYear = Math.floor(30 + Math.random() * 40);
    }
    
    for (let i = 0; i < eventsPerYear; i++) {
      let month;
      if (year === 2026) {
        // Distribute 6 months (Apr-Sep) with 3 events each
        // If i=0,1,2 -> month 3 (Apr). If i=3,4,5 -> month 4 (May), etc.
        const monthOffset = Math.floor(i / 3);
        month = 3 + (monthOffset % 6); 
      } else {
        month = 4 + Math.floor(Math.random() * 8); // May to Dec for past years
      }
      
      const day = Math.floor(Math.random() * 28) + 1;
      const startDate = new Date(year, month, day, 9, 0, 0);
      const endDate = new Date(year, month, day + Math.floor(Math.random() * 3) + 1, 18, 0, 0);
      const now = new Date();
      
      let status;
      if (year < 2026 || (year === 2026 && endDate < now)) {
        status = Math.random() > 0.1 ? 'COMPLETED' : 'CANCELLED';
      } else if (year === 2026 && startDate <= now && endDate >= now) {
        status = 'ONGOING';
      } else {
        const rand = Math.random();
        if (rand < 0.3) status = 'UPCOMING';
        else if (rand < 0.6) status = 'REGISTRATION_OPEN';
        else status = 'APPROVED';
      }
      
      const type = getRandom(EVENT_TYPES);
      const eventNameList = REAL_EVENT_NAMES[type];
      const eventName = eventNameList[i % eventNameList.length];
      const title = `${eventName} ${year}`;
      const maxParticipants = 100 + Math.floor(Math.random() * 400);
 
      const event = await prisma.event.create({
        data: {
          title,
          type,
          description: `A prestigious ${type} event. Join us for an exciting opportunity to compete with the best talents from across the nation. Network with industry experts and showcase your skills.`,
          startDate,
          endDate,
          institutionId: getRandom(institutions).id,
          venueId: getRandom(venues).id,
          status,
          updatedAt: new Date(),
          maxParticipants
        }
      });
      eventIds.push(event.id);
      eventCount++;

      // Assign coordinator (prioritizing the demo organizer for SRMIST to populate the demo dashboard)
      let eventOrg = allOrganizers.find(org => org.institutionId === event.institutionId && org.email === 'organizer@srmist.edu.in');
      if (!eventOrg) {
        eventOrg = allOrganizers.find(org => org.institutionId === event.institutionId) || allOrganizers[0];
      }
      if (eventOrg) {
        await prisma.eventcoordinator.create({
          data: {
            eventId: event.id,
            userId: eventOrg.id
          }
        });
      }

      // Phase 6: Segments - ADDED updatedAt
      const segments = ['General'];
      for (const segmentName of segments) {
        await prisma.segment.create({ 
          data: { 
            name: segmentName,
            eventId: event.id,
            updatedAt: new Date()
          } 
        });
      }

      // Phase 10: Budgets - FIXED with allocated field
      await prisma.budget.create({ 
        data: { 
          eventId: event.id, 
          allocated: 50000 + Math.random() * 200000,
          spent: Math.random() * 150000,
        } 
      });

      // Phase 11: Sponsors - FIXED field names
      if (Math.random() > 0.3) {
        await prisma.sponsor.create({ 
          data: { 
            name: getRandom(SPONSORS), 
            contribution: 10000 + Math.random() * 50000,
            eventId: event.id,
          } 
        });
      }

      // Add registrations based on occupation rules
      const isActive = ['ONGOING', 'UPCOMING', 'REGISTRATION_OPEN', 'APPROVED', 'ACTIVE'].includes(status);
      const isPast = status === 'COMPLETED';

      if (isActive || isPast) {
        let percentage;
        if (isActive) {
          percentage = 0.50; // Exact 50%
        } else {
          percentage = 0.65 + (Math.random() * 0.35); // 65% to 100%
        }
        
        const regLimit = Math.floor(maxParticipants * percentage);
        const shuffled = [...allParticipants].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(regLimit, shuffled.length));

        const regsData = selected.map(p => ({
          userId: p.id,
          eventId: event.id,
        }));

        try {
          if (regsData.length > 0) {
            await prisma.registration.createMany({ data: regsData, skipDuplicates: true });
          }
        } catch (e) {
          // Skip
        }
      }
    }
  }
  
  console.log(`✓ Created ${eventCount} events`);

  // Phase 7 & 8: Winners & Feedback
  console.log("🏆 Seeding Winners and Feedback...");
  const pastEvents = await prisma.event.findMany({ where: { status: 'COMPLETED' } });
  let winnersCount = 0;
  let feedbackCount = 0;

  for (const event of pastEvents) {
    const registrations = await prisma.registration.findMany({ where: { eventId: event.id }, take: 50 });
    
    if (registrations.length > 0) {
      const segments = await prisma.segment.findMany({ where: { eventId: event.id } });
      
      for (const segment of segments) {
        for (let position = 1; position <= 3 && position <= registrations.length; position++) {
          try {
            await prisma.winner.create({
              data: {
                userId: registrations[Math.floor(Math.random() * registrations.length)].userId,
                eventId: event.id,
                segmentId: segment.id,
                position,
              }
            });
            winnersCount++;
          } catch (e) {
            // Skip duplicates
          }
        }
      }

      // Add feedback with a realistic distribution of ratings (including low ratings)
      let ratingBase;
      const eventRand = Math.random();
      if (eventRand < 0.08) {
        // 8% of events are rated poorly (mostly 1s and 2s)
        ratingBase = () => 1 + Math.floor(Math.random() * 2);
      } else if (eventRand < 0.25) {
        // 17% of events are average (mostly 3s and 4s)
        ratingBase = () => 3 + Math.floor(Math.random() * 2);
      } else {
        // 75% of events are good (mostly 4s and 5s)
        ratingBase = () => 4 + Math.floor(Math.random() * 2);
      }

      const feedbackData = registrations.slice(0, 10).map(reg => ({
        userId: reg.userId,
        eventId: event.id,
        rating: ratingBase(),
        review: "Excellent organization and competitive spirit!",
      }));
      
      try {
        await prisma.feedback.createMany({ data: feedbackData, skipDuplicates: true });
        feedbackCount += feedbackData.length;
      } catch (e) {
        // Skip
      }
    }
  }
  
  console.log(`✓ Created ${winnersCount} winners and ${feedbackCount} feedback entries`);

  // Phase 12: Event Proposals
  console.log("📜 Seeding Proposals...");
  let proposalCount = 0;
  for (let i = 0; i < 20; i++) {
    const type = getRandom(EVENT_TYPES);
    const eventNameList = REAL_EVENT_NAMES[type];
    const eventName = eventNameList[i % eventNameList.length];

    const event = await prisma.event.create({
      data: {
        title: `${eventName} 2026 (Proposed)`,
        type,
        description: "A new proposal for 2026. This innovative event aims to bring together talented individuals.",
        startDate: new Date("2026-10-10"),
        endDate: new Date("2026-10-12"),
        institutionId: getRandom(institutions).id,
        status: 'PROPOSED',
        updatedAt: new Date(),
        venueId: getRandom(venues).id,
        maxParticipants: 200
      }
    });
    
    // Create budget record for this proposal
    await prisma.budget.create({
      data: {
        eventId: event.id,
        allocated: 50000 + Math.floor(Math.random() * 150000), // Random budget between 50k and 200k
        spent: 0
      }
    });
    
    await prisma.eventproposal.create({
      data: { 
        eventId: event.id, 
        organizerId: getRandom(organizers).id, 
        status: i % 3 === 0 ? 'REJECTED' : (i % 2 === 0 ? 'APPROVED' : 'PENDING'),
      }
    });
    proposalCount++;
  }
  console.log(`✓ Created ${proposalCount} proposals`);

  console.log("\n🏁 ULTIMATE SEEDING COMPLETE!");
  console.log(`📊 Final Stats:`);
  console.log(`   ✓ ${institutions.length} Institutions`);
  console.log(`   ✓ ${venues.length} Venues`);
  console.log(`   ✓ ${await prisma.user.count()} Users`);
  console.log(`   ✓ ${eventCount} Events (2016-2026, starting from May)`);
  console.log(`   ✓ ${winnersCount} Winners`);
  console.log(`   ✓ ${feedbackCount} Feedback entries`);
  console.log(`   ✓ ${proposalCount} Proposals`);
}

main()
  .catch(e => { 
    console.error("❌ Seeding Error:", e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });