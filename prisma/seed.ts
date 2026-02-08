import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

function createPrismaClient() {
  if (process.env.TURSO_DATABASE_URL) {
    const adapter = new PrismaLibSQL({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

const prisma = createPrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data (ignore errors if tables are already empty)
  try {
    await prisma.vote.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.videoView.deleteMany();
    await prisma.review.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.userPreferences.deleteMany();
    await prisma.child.deleteMany();
    await prisma.video.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
  } catch {
    console.log("Skipped cleanup (tables may already be empty)");
  }

  // Create groups sequentially (Turso doesn't handle parallel writes well)
  const groupData = [
    { name: "Tiny Explorers", slug: "tiny-explorers", description: "For parents of 1-2 year olds. First screens, sensory videos, parent-led viewing tips, and navigating the earliest stages of media exposure.", ageMin: 1, ageMax: 2, icon: "🐣", memberCount: 0 },
    { name: "Curious Toddlers", slug: "curious-toddlers", description: "For parents of 2-3 year olds. Dealing with tantrums, finding educational content, and managing growing screen curiosity.", ageMin: 2, ageMax: 3, icon: "🧸", memberCount: 0 },
    { name: "Little Learners", slug: "little-learners", description: "For parents of 3-4 year olds. Pre-school prep, social skills through media, alphabet and counting content.", ageMin: 3, ageMax: 4, icon: "📚", memberCount: 0 },
    { name: "Preschool Pals", slug: "preschool-pals", description: "For parents of 4-5 year olds. Kindergarten prep, creative content, building independence with screen choices.", ageMin: 4, ageMax: 5, icon: "🎨", memberCount: 0 },
    { name: "Kindergarten Kids", slug: "kindergarten-kids", description: "For parents of 5-6 year olds. Balancing homework and screen time, age-appropriate shows, and navigating peer influence.", ageMin: 5, ageMax: 6, icon: "🎒", memberCount: 0 },
  ];

  const groups = [];
  for (const data of groupData) {
    const group = await prisma.group.create({ data });
    groups.push(group);
  }
  console.log(`Created ${groups.length} groups`);

  // Create sample users sequentially
  const passwordHash = await bcrypt.hash("password123", 10);

  const userData = [
    { name: "Sarah Chen", email: "sarah@example.com", passwordHash, childName: "Mia", childAge: 3, onboardingComplete: true, preferences: { create: { concerns: JSON.stringify(["Content safety & appropriateness", "Finding quality educational content"]), situations: JSON.stringify(["Meal prep / cooking time", "Bedtime wind-down"]), contentPrefs: JSON.stringify(["Educational & learning", "Calming & slow-paced"]) } } },
    { name: "Marcus Johnson", email: "marcus@example.com", passwordHash, childName: "Jayden", childAge: 5, onboardingComplete: true, preferences: { create: { concerns: JSON.stringify(["Too much screen time overall", "YouTube algorithm showing bad content"]), situations: JSON.stringify(["After school decompression", "Travel & car rides"]), contentPrefs: JSON.stringify(["Creative & artistic", "Physical activity & dance"]) } } },
    { name: "Emily Rodriguez", email: "emily@example.com", passwordHash, childName: "Sofia", childAge: 2, onboardingComplete: true, preferences: { create: { concerns: JSON.stringify(["Sleep disruption from screens", "Attention & focus issues"]), situations: JSON.stringify(["Sibling nap time", "Work-from-home moments"]), contentPrefs: JSON.stringify(["Music & songs", "Nature & animals"]) } } },
  ];

  const users = [];
  for (const data of userData) {
    const user = await prisma.user.create({ data });
    users.push(user);
  }
  console.log(`Created ${users.length} users`);

  // Create children records (DOB calculated from childAge for sample data)
  const childrenData = [
    { userId: users[0].id, name: "Mia", dateOfBirth: new Date(new Date().getFullYear() - 3, 2, 15) },
    { userId: users[1].id, name: "Jayden", dateOfBirth: new Date(new Date().getFullYear() - 5, 7, 22) },
    { userId: users[1].id, name: "Lily", dateOfBirth: new Date(new Date().getFullYear() - 2, 11, 5) },
    { userId: users[2].id, name: "Sofia", dateOfBirth: new Date(new Date().getFullYear() - 2, 5, 10) },
  ];

  for (const child of childrenData) {
    await prisma.child.create({ data: child });
  }
  console.log(`Created ${childrenData.length} children`);

  // Add group memberships
  await prisma.groupMember.create({ data: { userId: users[0].id, groupId: groups[2].id } });
  await prisma.groupMember.create({ data: { userId: users[1].id, groupId: groups[4].id } });
  await prisma.groupMember.create({ data: { userId: users[2].id, groupId: groups[1].id } });
  await prisma.group.update({ where: { id: groups[2].id }, data: { memberCount: 1 } });
  await prisma.group.update({ where: { id: groups[4].id }, data: { memberCount: 1 } });
  await prisma.group.update({ where: { id: groups[1].id }, data: { memberCount: 1 } });

  // Create videos sequentially
  const videoData = [
    // Ages 1-2: Tiny Explorers
    { youtubeId: "w08k0bq4O4o", title: "Hey Bear Sensory - Rainbow Summertime", description: "High contrast animation with fun music, perfect for babies and toddlers. Bright colors and gentle movement.", channelName: "Hey Bear Sensory", ageMin: 1, ageMax: 2, category: "Calming", tags: JSON.stringify(["Bedtime Wind-Down", "Meal Prep"]), thumbnailUrl: "https://img.youtube.com/vi/w08k0bq4O4o/mqdefault.jpg", parentRating: 4.5, reviewCount: 3 },
    { youtubeId: "r2b2bvkjRcI", title: "Hey Bear Sensory - Rainbow Dance Party", description: "Colorful dancing characters with upbeat music. Great for keeping little ones engaged during meal prep.", channelName: "Hey Bear Sensory", ageMin: 1, ageMax: 2, category: "Educational", tags: JSON.stringify(["Meal Prep", "Quick Switch"]), thumbnailUrl: "https://img.youtube.com/vi/r2b2bvkjRcI/mqdefault.jpg", parentRating: 4.7, reviewCount: 5 },
    { youtubeId: "yCjJyiqpAuU", title: "Twinkle Twinkle Little Star - Super Simple Songs", description: "Classic lullaby with gentle animation. Perfect for bedtime wind-down routines.", channelName: "Super Simple Songs", ageMin: 1, ageMax: 3, category: "Calming", tags: JSON.stringify(["Bedtime Wind-Down"]), thumbnailUrl: "https://img.youtube.com/vi/yCjJyiqpAuU/mqdefault.jpg", parentRating: 4.8, reviewCount: 8 },
    { youtubeId: "e_04ZrNroTo", title: "Baby Sign Language Basics", description: "Learn basic sign language with your baby. Teaches common words like more, eat, milk, and all done.", channelName: "Baby Signing Time", ageMin: 1, ageMax: 2, category: "Language", tags: JSON.stringify(["Skill Bridge", "Meal Prep"]), thumbnailUrl: "https://img.youtube.com/vi/e_04ZrNroTo/mqdefault.jpg", parentRating: 4.3, reviewCount: 2 },
    { youtubeId: "fdPu-wvl3KE", title: "Peek A Boo Song - CoComelon", description: "Interactive peek-a-boo game that encourages babies to engage with the screen. Good for short engagement.", channelName: "CoComelon", ageMin: 1, ageMax: 2, category: "Social Skills", tags: JSON.stringify(["Public Reset", "Quick Switch"]), thumbnailUrl: "https://img.youtube.com/vi/fdPu-wvl3KE/mqdefault.jpg", parentRating: 4.0, reviewCount: 3 },
    // Ages 2-3: Curious Toddlers
    { youtubeId: "pWepfJ-8XU0", title: "Daniel Tiger - Managing Feelings", description: "Daniel Tiger learns to manage big feelings with strategies kids can use. Great for emotional development.", channelName: "Daniel Tiger's Neighborhood", ageMin: 2, ageMax: 4, category: "Social Skills", tags: JSON.stringify(["Tantrum Moments", "Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/pWepfJ-8XU0/mqdefault.jpg", parentRating: 4.9, reviewCount: 12 },
    { youtubeId: "D0Ajq682yrA", title: "Colors Song - CoComelon", description: "Learn colors through catchy music and animation. Engaging and educational for toddlers.", channelName: "CoComelon", ageMin: 2, ageMax: 3, category: "Educational", tags: JSON.stringify(["Meal Prep", "Quick Switch"]), thumbnailUrl: "https://img.youtube.com/vi/D0Ajq682yrA/mqdefault.jpg", parentRating: 3.8, reviewCount: 6 },
    { youtubeId: "75NQK-Sm1YY", title: "Counting to 10 - Jack Hartmann", description: "Fun counting song with movement. Gets kids moving while learning numbers from 1 to 10.", channelName: "Jack Hartmann Kids Music", ageMin: 2, ageMax: 4, category: "Educational", tags: JSON.stringify(["Skill Bridge", "Quick Switch"]), thumbnailUrl: "https://img.youtube.com/vi/75NQK-Sm1YY/mqdefault.jpg", parentRating: 4.5, reviewCount: 4 },
    { youtubeId: "rA-MvQ2ZL6o", title: "Sesame Street: 1 Hour of Alphabet Songs with Elmo & Friends", description: "Elmo and friends sing alphabet songs. Great for learning letters and calming down with familiar characters.", channelName: "Sesame Street", ageMin: 2, ageMax: 4, category: "Calming", tags: JSON.stringify(["Tantrum Moments", "Bedtime Wind-Down"]), thumbnailUrl: "https://img.youtube.com/vi/rA-MvQ2ZL6o/mqdefault.jpg", parentRating: 4.7, reviewCount: 7 },
    { youtubeId: "zXEq-QO3xTg", title: "The Animals On The Farm - Super Simple Songs", description: "Classic farm animal song with colorful animation. Kids love joining in with animal sounds.", channelName: "Super Simple Songs", ageMin: 2, ageMax: 3, category: "Language", tags: JSON.stringify(["Travel", "Public Reset"]), thumbnailUrl: "https://img.youtube.com/vi/zXEq-QO3xTg/mqdefault.jpg", parentRating: 4.2, reviewCount: 5 },
    // Ages 3-4: Little Learners
    { youtubeId: "hq3yfQnllfQ", title: "Phonics Song - A to Z for Kids", description: "Learn the alphabet and phonics sounds. Each letter comes with examples and fun animation.", channelName: "Kids TV", ageMin: 3, ageMax: 5, category: "Educational", tags: JSON.stringify(["Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/hq3yfQnllfQ/mqdefault.jpg", parentRating: 4.4, reviewCount: 6 },
    { youtubeId: "zjq2HFKZnSE", title: "Bluey - Fantasy Full Episodes Compilation", description: "Official Bluey full episode compilation featuring imaginative play and family adventures. Beautifully done.", channelName: "Bluey - Official Channel", ageMin: 3, ageMax: 6, category: "Social Skills", tags: JSON.stringify(["Bedtime Wind-Down"]), thumbnailUrl: "https://img.youtube.com/vi/zjq2HFKZnSE/mqdefault.jpg", parentRating: 5.0, reviewCount: 15 },
    { youtubeId: "BljQ7iFlW8o", title: "How To Draw Cute Fish - Art for Kids Hub", description: "Step-by-step drawing tutorials for kids. Simple enough for beginners, encourages creativity.", channelName: "Art for Kids Hub", ageMin: 3, ageMax: 6, category: "Creative", tags: JSON.stringify(["Sibling Nap", "Meal Prep"]), thumbnailUrl: "https://img.youtube.com/vi/BljQ7iFlW8o/mqdefault.jpg", parentRating: 4.6, reviewCount: 4 },
    { youtubeId: "AnoNb2OMQ6s", title: "Shapes Song - The Kiboomers", description: "Learn shapes through music and colorful animation. Circle, square, triangle and more!", channelName: "The Kiboomers", ageMin: 3, ageMax: 4, category: "Educational", tags: JSON.stringify(["Quick Switch", "Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/AnoNb2OMQ6s/mqdefault.jpg", parentRating: 4.1, reviewCount: 3 },
    { youtubeId: "xlg052EKMtk", title: "Frozen - A Cosmic Kids Yoga Adventure", description: "Fun yoga adventure for kids inspired by Frozen. Great for burning energy indoors and developing body awareness.", channelName: "Cosmic Kids Yoga", ageMin: 3, ageMax: 6, category: "Motor Skills", tags: JSON.stringify(["Public Reset", "Travel"]), thumbnailUrl: "https://img.youtube.com/vi/xlg052EKMtk/mqdefault.jpg", parentRating: 4.8, reviewCount: 9 },
    // Ages 4-5: Preschool Pals
    { youtubeId: "Vb2ZXRh74WU", title: "StoryBots Outer Space - Planets, Sun, Moon, Earth and Stars", description: "Learn about planets and space through catchy songs. Netflix-quality educational content.", channelName: "Netflix Jr.", ageMin: 4, ageMax: 6, category: "Educational", tags: JSON.stringify(["Skill Bridge", "Quick Switch"]), thumbnailUrl: "https://img.youtube.com/vi/Vb2ZXRh74WU/mqdefault.jpg", parentRating: 4.7, reviewCount: 8 },
    { youtubeId: "OWgRsFw0iU0", title: "Numberblocks - Now You See Us (Full Episode)", description: "Animated number characters that teach math concepts. Engaging and surprisingly effective.", channelName: "Numberblocks", ageMin: 4, ageMax: 6, category: "Educational", tags: JSON.stringify(["Skill Bridge", "Meal Prep"]), thumbnailUrl: "https://img.youtube.com/vi/OWgRsFw0iU0/mqdefault.jpg", parentRating: 4.9, reviewCount: 11 },
    { youtubeId: "BQ9q4U2P3ig", title: "GoNoodle - Banana Banana Meatball", description: "High-energy dance and movement video. Perfect for burning off energy before settling down.", channelName: "GoNoodle", ageMin: 4, ageMax: 6, category: "Motor Skills", tags: JSON.stringify(["Quick Switch", "Public Reset"]), thumbnailUrl: "https://img.youtube.com/vi/BQ9q4U2P3ig/mqdefault.jpg", parentRating: 4.3, reviewCount: 5 },
    { youtubeId: "aOebfGGcjVw", title: "SciShow Kids - Why Do We Brush Our Teeth?", description: "Fun science explanation of dental hygiene for kids. Great for building the tooth-brushing habit.", channelName: "SciShow Kids", ageMin: 4, ageMax: 6, category: "Educational", tags: JSON.stringify(["Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/aOebfGGcjVw/mqdefault.jpg", parentRating: 4.4, reviewCount: 3 },
    { youtubeId: "ML8IL77gQ3k", title: "Sesame Street: The Alphabet With Elmo", description: "Learn the alphabet with Elmo and India Arie through song and movement.", channelName: "Sesame Street", ageMin: 4, ageMax: 5, category: "Social Skills", tags: JSON.stringify(["Tantrum Moments", "Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/ML8IL77gQ3k/mqdefault.jpg", parentRating: 4.5, reviewCount: 4 },
    // Ages 5-6: Kindergarten Kids
    { youtubeId: "eT89nvkYNDM", title: "Nat Geo Kids - Amazing Animals: Scorpion", description: "Real animal footage with fun facts. Sparks curiosity about the natural world.", channelName: "Nat Geo Kids", ageMin: 5, ageMax: 6, category: "Educational", tags: JSON.stringify(["Meal Prep", "Sibling Nap"]), thumbnailUrl: "https://img.youtube.com/vi/eT89nvkYNDM/mqdefault.jpg", parentRating: 4.6, reviewCount: 6 },
    { youtubeId: "922_Cq0TlfQ", title: "Easy Crafts for Kids - 5 Minute Games", description: "Easy craft projects kids can follow along with. Uses common household materials.", channelName: "Crafting Bliss", ageMin: 5, ageMax: 6, category: "Creative", tags: JSON.stringify(["Sibling Nap", "Meal Prep"]), thumbnailUrl: "https://img.youtube.com/vi/922_Cq0TlfQ/mqdefault.jpg", parentRating: 4.0, reviewCount: 4 },
    { youtubeId: "gIZjrcG9pW0", title: "Sight Words Kindergarten - Jack Hartmann", description: "Learn common sight words through repetition and engaging visuals. Great kindergarten prep.", channelName: "Jack Hartmann Kids Music Channel", ageMin: 5, ageMax: 6, category: "Language", tags: JSON.stringify(["Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/gIZjrcG9pW0/mqdefault.jpg", parentRating: 4.5, reviewCount: 5 },
    { youtubeId: "6v-a_dpwhro", title: "Brainchild - How Does Memory Work?", description: "Kid-friendly explanation of how memory works. Engaging science content for curious minds.", channelName: "Brainchild", ageMin: 5, ageMax: 6, category: "Educational", tags: JSON.stringify(["Quick Switch"]), thumbnailUrl: "https://img.youtube.com/vi/6v-a_dpwhro/mqdefault.jpg", parentRating: 4.3, reviewCount: 3 },
    { youtubeId: "388Q44ReOWE", title: "Relaxing Nature Sounds for Kids", description: "Gentle nature sounds with beautiful imagery. Perfect for winding down before bed.", channelName: "Relaxation Channel", ageMin: 1, ageMax: 6, category: "Calming", tags: JSON.stringify(["Bedtime Wind-Down"]), thumbnailUrl: "https://img.youtube.com/vi/388Q44ReOWE/mqdefault.jpg", parentRating: 4.6, reviewCount: 7 },

    // === DRRC Curated Videos ===
    // Animal Lovers (ages 5-6)
    { youtubeId: "-Dk_oIWdbZM", title: "Lucy The Goldfish | Doctor Poppy", description: "Animated story about Lucy the Goldfish. Fun animal cartoon teaching kids about aquatic life.", channelName: "Doctor Poppy - Animals for Kids", ageMin: 5, ageMax: 6, category: "Educational", tags: JSON.stringify(["Meal Prep", "Sibling Nap"]), thumbnailUrl: "https://img.youtube.com/vi/-Dk_oIWdbZM/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "e2lQWgc5FHE", title: "Best of Dino Dana | Splash! Dance! Dinos!", description: "Action-packed dinosaur adventures from Dino Dana. Kids learn about different dinosaur species.", channelName: "Dino Dana", ageMin: 5, ageMax: 6, category: "Educational", tags: JSON.stringify(["Quick Switch", "Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/e2lQWgc5FHE/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "IFbN29AbYs0", title: "Asha the Cheetah | Doctor Poppy", description: "Follow Asha the Cheetah in this animated animal adventure. Great for kids who love wild animals.", channelName: "Doctor Poppy - Animals for Kids", ageMin: 5, ageMax: 6, category: "Educational", tags: JSON.stringify(["Meal Prep"]), thumbnailUrl: "https://img.youtube.com/vi/IFbN29AbYs0/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "OGIbJ49j3qM", title: "Best of Dino Dan | Best of Brothers!", description: "Dino Dan compilation featuring brotherly dinosaur adventures and paleontology facts.", channelName: "Dino Dan", ageMin: 5, ageMax: 6, category: "Educational", tags: JSON.stringify(["Skill Bridge", "Quick Switch"]), thumbnailUrl: "https://img.youtube.com/vi/OGIbJ49j3qM/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "c7a651JkdUA", title: "The Giant Pacific Octopus", description: "Learn about the Giant Pacific Octopus and its amazing abilities. Fun marine biology for kids.", channelName: "Doctor Poppy - Animals for Kids", ageMin: 5, ageMax: 6, category: "Educational", tags: JSON.stringify(["Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/c7a651JkdUA/mqdefault.jpg", parentRating: 0, reviewCount: 0 },

    // Art Enthusiasts (ages 5-6)
    { youtubeId: "MPvJ1r2TJ8A", title: "How to Draw Op Art Stairs 3D", description: "Easy step-by-step tutorial for drawing amazing 3D optical illusion stairs. Great for all ages!", channelName: "Kylee Makes It", ageMin: 5, ageMax: 6, category: "Creative", tags: JSON.stringify(["Sibling Nap", "Meal Prep"]), thumbnailUrl: "https://img.youtube.com/vi/MPvJ1r2TJ8A/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "CJQdZT6YRKs", title: "How to Make Ice Circles | Easy Winter Craft", description: "Fun winter craft for kids using ice. Simple and creative project with common household items.", channelName: "Kylee Makes It", ageMin: 5, ageMax: 6, category: "Creative", tags: JSON.stringify(["Sibling Nap", "Meal Prep"]), thumbnailUrl: "https://img.youtube.com/vi/CJQdZT6YRKs/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "k2gTsMiE7QI", title: "Solar Eclipse Snack Cup Craft", description: "Make a fun solar eclipse themed snack cup! Easy craft that combines learning about space with creativity.", channelName: "Kylee Makes It", ageMin: 5, ageMax: 6, category: "Creative", tags: JSON.stringify(["Skill Bridge", "Meal Prep"]), thumbnailUrl: "https://img.youtube.com/vi/k2gTsMiE7QI/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "sz-Panw9w80", title: "Marie's Masterpiece - Visit the Art Gallery | JoJo and Gran Gran", description: "JoJo visits the art gallery and learns about famous artwork. Encourages creativity and cultural appreciation.", channelName: "JoJo and Gran Gran", ageMin: 3, ageMax: 5, category: "Creative", tags: JSON.stringify(["Skill Bridge", "Quick Switch"]), thumbnailUrl: "https://img.youtube.com/vi/sz-Panw9w80/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "UnJYYrw8Qq0", title: "Tremendous Tube Taco Craft | Mister Maker", description: "Fun taco-themed craft project from Mister Maker. Simple shapes and creative fun for kids.", channelName: "Mister Maker", ageMin: 5, ageMax: 6, category: "Creative", tags: JSON.stringify(["Sibling Nap", "Meal Prep"]), thumbnailUrl: "https://img.youtube.com/vi/UnJYYrw8Qq0/mqdefault.jpg", parentRating: 0, reviewCount: 0 },

    // Cartoons (ages 1-4)
    { youtubeId: "U4WdcyaRHlU", title: "Zou is the driver! | ZOU in English", description: "Zou the little zebra pretends to be a driver in this charming animated episode. Gentle storytelling for preschoolers.", channelName: "ZOU", ageMin: 2, ageMax: 4, category: "Social Skills", tags: JSON.stringify(["Bedtime Wind-Down", "Meal Prep"]), thumbnailUrl: "https://img.youtube.com/vi/U4WdcyaRHlU/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "Q0ddKquQf6A", title: "Zou makes a cherry pie with Grandma | ZOU", description: "Zou helps Grandma make a cherry pie. Sweet family-oriented episode about cooking together.", channelName: "ZOU", ageMin: 2, ageMax: 4, category: "Social Skills", tags: JSON.stringify(["Meal Prep", "Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/Q0ddKquQf6A/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "iy7CyA12TCk", title: "PinCode | Adventures in Space", description: "Educational cartoon about space adventures. Best episodes collection with fun science concepts.", channelName: "PinCode", ageMin: 3, ageMax: 4, category: "Educational", tags: JSON.stringify(["Skill Bridge", "Quick Switch"]), thumbnailUrl: "https://img.youtube.com/vi/iy7CyA12TCk/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "DiJKuhz9W5U", title: "Mouk - Shipwrecked! and the Salt Lake", description: "Mouk travels to Madagascar and Turkey in these animated adventures. Geography and culture for kids.", channelName: "Mouk", ageMin: 3, ageMax: 4, category: "Social Skills", tags: JSON.stringify(["Travel", "Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/DiJKuhz9W5U/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "F8yVAj7L4hk", title: "Olette Rescue Hero - Firefighter, Doctor or Lifeguard | Dr. Panda TotoTime", description: "Kids learn about rescue heroes and helping others. Fun cartoon about community helpers.", channelName: "Dr. Panda TotoTime", ageMin: 2, ageMax: 4, category: "Social Skills", tags: JSON.stringify(["Skill Bridge", "Quick Switch"]), thumbnailUrl: "https://img.youtube.com/vi/F8yVAj7L4hk/mqdefault.jpg", parentRating: 0, reviewCount: 0 },

    // Diverse Representations (ages 5-6)
    { youtubeId: "3KLrP1Afr3U", title: "Behind the Scenes of Soul Food Series | Kids Cooking", description: "Go behind the scenes of a kids cooking show featuring soul food recipes. Cultural cooking for kids.", channelName: "Bino and Fino", ageMin: 5, ageMax: 6, category: "Creative", tags: JSON.stringify(["Meal Prep", "Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/3KLrP1Afr3U/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "gYAWRm1WHi8", title: "Learn All About The Caribbean For Kids!", description: "Educational video teaching kids about Caribbean culture, geography, and traditions.", channelName: "Bino and Fino", ageMin: 5, ageMax: 6, category: "Educational", tags: JSON.stringify(["Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/gYAWRm1WHi8/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "D0vrtPrJ-3s", title: "Counting My Puff Puff - Bino and Fino Kids Songs", description: "Catchy counting song featuring African culture. Fun music and dance that teaches numbers.", channelName: "Bino and Fino", ageMin: 5, ageMax: 6, category: "Language", tags: JSON.stringify(["Quick Switch", "Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/D0vrtPrJ-3s/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "EN1SxGLlvCs", title: "What Do You Say When You Meet Friends?", description: "Bino and Fino teach kids about greetings and social manners when meeting friends.", channelName: "Bino and Fino", ageMin: 5, ageMax: 6, category: "Social Skills", tags: JSON.stringify(["Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/EN1SxGLlvCs/mqdefault.jpg", parentRating: 0, reviewCount: 0 },

    // Early Learning (ages 1-4)
    { youtubeId: "quA4IurhxPk", title: "Learn Numbers, Shapes and Colors with Chain Reactions!", description: "Engaging chain reactions teach numbers, shapes and colors. Visual learning with Max and Friends.", channelName: "Bounce Patrol", ageMin: 1, ageMax: 4, category: "Educational", tags: JSON.stringify(["Skill Bridge", "Quick Switch"]), thumbnailUrl: "https://img.youtube.com/vi/quA4IurhxPk/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "xCxLJRG55dA", title: "Learn Colors | Color Skills Listening Activity", description: "Interactive color learning activity for toddlers and preschoolers. Listening skills practice.", channelName: "Bounce Patrol", ageMin: 1, ageMax: 3, category: "Educational", tags: JSON.stringify(["Skill Bridge", "Meal Prep"]), thumbnailUrl: "https://img.youtube.com/vi/xCxLJRG55dA/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "jIqyBvFJnLA", title: "Mother Goose Club Birthday Party Songs", description: "Collection of birthday and party songs from Mother Goose Club. Fun nursery rhymes for toddlers.", channelName: "Mother Goose Club", ageMin: 1, ageMax: 3, category: "Language", tags: JSON.stringify(["Quick Switch", "Public Reset"]), thumbnailUrl: "https://img.youtube.com/vi/jIqyBvFJnLA/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "rvet0T6omns", title: "Soccer Rocker | Bounce Patrol", description: "Energetic soccer-themed song that gets kids moving and singing along. Great for active play time.", channelName: "Bounce Patrol", ageMin: 2, ageMax: 4, category: "Motor Skills", tags: JSON.stringify(["Quick Switch", "Public Reset"]), thumbnailUrl: "https://img.youtube.com/vi/rvet0T6omns/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "3acQC_BIgDc", title: "Dance with your family! | Bounce Patrol", description: "Fun family dance-along video. Gets the whole family moving together with easy-to-follow moves.", channelName: "Bounce Patrol", ageMin: 1, ageMax: 4, category: "Motor Skills", tags: JSON.stringify(["Quick Switch", "Public Reset"]), thumbnailUrl: "https://img.youtube.com/vi/3acQC_BIgDc/mqdefault.jpg", parentRating: 0, reviewCount: 0 },

    // Encouraging Movement / PE (ages 5-6)
    { youtubeId: "6ZYpu4pHEkY", title: "Swan Lake - Kids Ballet Class", description: "Follow along with a Swan Lake themed kids ballet class. Develops coordination and creative movement.", channelName: "Cosmic Kids Yoga", ageMin: 5, ageMax: 6, category: "Motor Skills", tags: JSON.stringify(["Quick Switch", "Public Reset"]), thumbnailUrl: "https://img.youtube.com/vi/6ZYpu4pHEkY/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "kXUO3y5QrKg", title: "Star Wars Rey Skywalker Staff Workout", description: "Fun Star Wars themed workout for kids. Gets children active with a movie-inspired exercise routine.", channelName: "Cosmic Kids Yoga", ageMin: 5, ageMax: 6, category: "Motor Skills", tags: JSON.stringify(["Quick Switch", "Public Reset"]), thumbnailUrl: "https://img.youtube.com/vi/kXUO3y5QrKg/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "fWCkFBFzVPQ", title: "Fun Dance Along for Kids 2-5 Years Old", description: "Easy dance-along designed specifically for young children. Simple moves that build confidence.", channelName: "Cosmic Kids Yoga", ageMin: 2, ageMax: 5, category: "Motor Skills", tags: JSON.stringify(["Quick Switch", "Public Reset"]), thumbnailUrl: "https://img.youtube.com/vi/fWCkFBFzVPQ/mqdefault.jpg", parentRating: 0, reviewCount: 0 },

    // Nature Lovers (ages 5-6)
    { youtubeId: "mme9pGvOmmA", title: "Saying Goodbye To Baby Beaver", description: "Heartwarming video about saying goodbye to a baby beaver. Real wildlife footage that teaches empathy.", channelName: "Tractor Ted", ageMin: 5, ageMax: 6, category: "Educational", tags: JSON.stringify(["Bedtime Wind-Down", "Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/mme9pGvOmmA/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "mNEO7UnUt-8", title: "Meet and Greet: Wonder the Porcupine!", description: "Meet Wonder the Porcupine up close! Real animal encounter that sparks curiosity about wildlife.", channelName: "Tractor Ted", ageMin: 5, ageMax: 6, category: "Educational", tags: JSON.stringify(["Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/mNEO7UnUt-8/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "QDujo8X_maQ", title: "It's A Great Time To Be A Black Bear!", description: "Learn about black bears through real footage and fun facts. Nature education for curious kids.", channelName: "Tractor Ted", ageMin: 5, ageMax: 6, category: "Educational", tags: JSON.stringify(["Skill Bridge", "Meal Prep"]), thumbnailUrl: "https://img.youtube.com/vi/QDujo8X_maQ/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "YE5UUDPlSLk", title: "Arctic Fox Facts", description: "Learn fascinating facts about Arctic Foxes with real wildlife footage. Perfect for young nature lovers.", channelName: "Tractor Ted", ageMin: 5, ageMax: 6, category: "Educational", tags: JSON.stringify(["Skill Bridge"]), thumbnailUrl: "https://img.youtube.com/vi/YE5UUDPlSLk/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "QfnSsSuFsiA", title: "Melons with George the Farmer", description: "George the Farmer teaches kids about melons on the farm. Real farming footage for nature lovers.", channelName: "Tractor Ted", ageMin: 5, ageMax: 6, category: "Educational", tags: JSON.stringify(["Skill Bridge", "Meal Prep"]), thumbnailUrl: "https://img.youtube.com/vi/QfnSsSuFsiA/mqdefault.jpg", parentRating: 0, reviewCount: 0 },

    // Stories (ages 5-6)
    { youtubeId: "m6J6nKUFIH4", title: "Parker the Penguin Goes on Vacation | Read Aloud", description: "Fun read aloud story about Parker the Penguin's summer vacation adventures.", channelName: "Moshi Kids", ageMin: 5, ageMax: 6, category: "Language", tags: JSON.stringify(["Bedtime Wind-Down", "Sibling Nap"]), thumbnailUrl: "https://img.youtube.com/vi/m6J6nKUFIH4/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "CcPA--X52qE", title: "Beige Crayon QUITS! | Read Aloud", description: "Engaging read aloud about a beige crayon who decides to quit. Teaches kids about being unique.", channelName: "Moshi Kids", ageMin: 5, ageMax: 6, category: "Language", tags: JSON.stringify(["Bedtime Wind-Down", "Sibling Nap"]), thumbnailUrl: "https://img.youtube.com/vi/CcPA--X52qE/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "hnWwbFwgN_o", title: "Sleepless in the Palace - Princesses and the Pea | Bedtime Story", description: "A bedtime story retelling of the Princess and the Pea. Perfect for winding down before sleep.", channelName: "Ms. Booksy", ageMin: 5, ageMax: 6, category: "Language", tags: JSON.stringify(["Bedtime Wind-Down"]), thumbnailUrl: "https://img.youtube.com/vi/hnWwbFwgN_o/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
    { youtubeId: "s-gIWuoW2zM", title: "ShiShi's Lullaby | Moshi Kids", description: "Gentle lullaby from Moshi Kids. Calming music and animation perfect for bedtime routines.", channelName: "Moshi Kids", ageMin: 3, ageMax: 6, category: "Calming", tags: JSON.stringify(["Bedtime Wind-Down"]), thumbnailUrl: "https://img.youtube.com/vi/s-gIWuoW2zM/mqdefault.jpg", parentRating: 0, reviewCount: 0 },
  ];

  const videos = [];
  for (const data of videoData) {
    const video = await prisma.video.create({ data });
    videos.push(video);
  }
  console.log(`Created ${videos.length} videos`);

  // Create sample reviews
  const reviewData = [
    { userId: users[0].id, videoId: videos[5].id, rating: 5, comment: "Daniel Tiger is incredible for emotional regulation. My 3yo now says 'take a deep breath' when she's upset. Game changer!", helpfulTags: ["Helped with tantrums", "Educational value", "Age appropriate"] },
    { userId: users[1].id, videoId: videos[5].id, rating: 5, comment: "We watch this whenever my son is having a tough day. The strategies actually stick with him.", helpfulTags: ["Helped with tantrums", "Good for calming"] },
    { userId: users[2].id, videoId: videos[1].id, rating: 5, comment: "Hey Bear is a lifesaver during dinner prep! My 18-month-old is mesmerized by the dancing veggies.", helpfulTags: ["Safe to leave on", "Kept attention well"] },
    { userId: users[0].id, videoId: videos[11].id, rating: 5, comment: "This Bluey episode is perfection. My daughter asks for it every night and it genuinely helps her transition to sleep.", helpfulTags: ["Good for bedtime", "Age appropriate", "Educational value"] },
    { userId: users[1].id, videoId: videos[14].id, rating: 5, comment: "Cosmic Kids Yoga is our go-to when the kids are bouncing off the walls. Burns energy AND teaches mindfulness.", helpfulTags: ["Encourages interaction", "Educational value", "Kept attention well"] },
    { userId: users[0].id, videoId: videos[16].id, rating: 5, comment: "Numberblocks single-handedly taught my kid to count to 20. She was adding numbers by age 4!", helpfulTags: ["Educational value", "Kept attention well", "Age appropriate"] },
    { userId: users[2].id, videoId: videos[2].id, rating: 5, comment: "Super Simple Songs is gentle enough for bedtime. The animation is calming, not over-stimulating.", helpfulTags: ["Good for bedtime", "Good for calming", "Safe to leave on"] },
  ];

  for (const review of reviewData) {
    await prisma.review.create({
      data: { ...review, helpfulTags: JSON.stringify(review.helpfulTags) },
    });
  }
  console.log(`Created ${reviewData.length} reviews`);

  // Create sample posts
  const postData = [
    { title: "What do you play during dinner prep? Need ideas!", content: "My 3yo needs something engaging while I cook. We've been doing Hey Bear on repeat and I need variety! What do your toddlers watch during that 20-30 minute window? Looking for something safe enough I don't need to supervise every second.", userId: users[0].id, groupId: groups[2].id, upvotes: 12, score: 12, commentCount: 3 },
    { title: "YouTube Kids vs regular YouTube with restrictions - what do you use?", content: "I've been going back and forth. YouTube Kids has weird content slip through sometimes, but regular YouTube's algorithm is even worse. What's your setup? Any tips for keeping the recommendations clean?", userId: users[1].id, groupId: groups[4].id, upvotes: 8, score: 7, commentCount: 2 },
    { title: "Bluey has ruined all other shows for us (in the best way)", content: "After discovering Bluey, my kids refuse to watch anything else. The emotional depth of this show is incredible. Sleepytime literally made me cry. Anyone else feel like Bluey raised the bar too high? What do you watch when you need a Bluey break?", userId: users[0].id, groupId: groups[2].id, upvotes: 25, score: 24, commentCount: 4 },
    { title: "Screen time guilt - how do you handle it?", content: "Some days I need the screen to just... survive. Working from home with a toddler is impossible without it. But then I read articles about screen limits and feel terrible. How do you balance being a present parent with the reality of needing breaks?", userId: users[2].id, groupId: groups[1].id, upvotes: 18, score: 17, commentCount: 5 },
    { title: "Best shows for teaching empathy and sharing?", content: "My 4yo is struggling with sharing at preschool. His teacher suggested using media to reinforce social skills. What shows or videos have actually helped your kids learn about sharing, taking turns, and understanding others' feelings?", userId: users[1].id, groupId: groups[3].id, upvotes: 10, score: 10, commentCount: 2 },
  ];

  const posts = [];
  for (const post of postData) {
    const created = await prisma.post.create({ data: post });
    posts.push(created);
  }
  console.log(`Created ${posts.length} posts`);

  // Create sample comments
  const commentData = [
    { content: "Cosmic Kids Yoga is amazing for this! It's engaging enough they stay put and it's actually good for them. Plus they burn energy at the same time.", userId: users[1].id, postId: posts[0].id },
    { content: "We do Art for Kids Hub with a little drawing station at the kitchen counter. She draws along and I can see her from where I'm cooking.", userId: users[2].id, postId: posts[0].id },
    { content: "Numberblocks! My kid is so absorbed by it that I can cook an entire meal without interruption. And he's actually learning math.", userId: users[1].id, postId: posts[0].id },
    { content: "We switched to curated playlists on regular YouTube. Takes more work upfront but the content quality is much better than what YouTube Kids serves up.", userId: users[0].id, postId: posts[1].id },
    { content: "YouTube Kids with the 'Approved Content Only' setting has been working well for us. It limits the library but at least we know everything is vetted.", userId: users[2].id, postId: posts[1].id },
    { content: "Bluey is genuinely one of the best shows on television - not just kids TV. The episode where Bandit plays with Bingo while exhausted from work? That's every parent.", userId: users[1].id, postId: posts[2].id },
    { content: "Daniel Tiger is amazing for this! The emotions songs are so catchy my kid sings them to himself when he's upset. 'When you feel so mad that you want to roar, take a deep breath and count to four.'", userId: users[0].id, postId: posts[4].id },
    { content: "You are NOT a bad parent for using screens. The research actually supports intentional screen time - it's the passive, unsupervised kind that's harmful. What you're doing by being here and thinking about content quality proves you care.", userId: users[0].id, postId: posts[3].id },
    { content: "Same boat here. I've learned that quality > quantity. 30 minutes of Daniel Tiger teaches more than 2 hours of random YouTube. Give yourself grace!", userId: users[1].id, postId: posts[3].id },
  ];

  for (const comment of commentData) {
    await prisma.comment.create({ data: comment });
  }
  console.log(`Created ${commentData.length} comments`);

  // Create votes
  await prisma.vote.create({ data: { userId: users[1].id, postId: posts[0].id, value: 1 } });
  await prisma.vote.create({ data: { userId: users[2].id, postId: posts[0].id, value: 1 } });
  await prisma.vote.create({ data: { userId: users[0].id, postId: posts[2].id, value: 1 } });
  await prisma.vote.create({ data: { userId: users[2].id, postId: posts[2].id, value: 1 } });
  await prisma.vote.create({ data: { userId: users[0].id, postId: posts[3].id, value: 1 } });
  await prisma.vote.create({ data: { userId: users[1].id, postId: posts[3].id, value: 1 } });

  console.log("Seed complete!");
  console.log(`Sample login: sarah@example.com / password123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
