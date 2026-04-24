require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in backend/.env",
  );
}

const supabase = createClient(supabaseUrl, serviceKey);

const SEED_BATCH = "needbridge-demo-v1";
const COORDINATOR_EMAIL =
  process.env.SEED_COORDINATOR_EMAIL || "coordinator@needbridge.org";
const COORDINATOR_PASSWORD =
  process.env.SEED_COORDINATOR_PASSWORD || "NeedBridge123!";
const ORGANIZATION_NAME =
  process.env.SEED_ORGANIZATION_NAME || "NeedBridge Relief Network";
const ORGANIZATION_EMAIL =
  process.env.SEED_ORGANIZATION_EMAIL || COORDINATOR_EMAIL;

const ZONES = [
  "Mumbai",
  "Pune",
  "Nagpur",
  "North Delhi",
  "South Delhi",
  "Central Delhi",
  "Bengaluru",
  "Mysuru",
  "Mangaluru",
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Ahmedabad",
  "Surat",
  "Vadodara",
  "Kolkata",
  "Darjeeling",
  "Howrah",
  "Lucknow",
  "Kanpur",
  "Varanasi",
];

const NEED_TEMPLATES = [
  {
    title: "Emergency drinking water delivery",
    category: "water",
    zone: "North Delhi",
    severity: 5,
    vulnerability_index: 5,
    people_affected: 80,
    volunteer_count_needed: 3,
    required_skills: ["driving", "logistics"],
  },
  {
    title: "Cooked meals for displaced families",
    category: "food",
    zone: "Pune",
    severity: 4,
    vulnerability_index: 4,
    people_affected: 60,
    volunteer_count_needed: 4,
    required_skills: ["cooking", "logistics"],
  },
  {
    title: "First-aid support camp",
    category: "medical",
    zone: "Bengaluru",
    severity: 5,
    vulnerability_index: 5,
    people_affected: 35,
    volunteer_count_needed: 2,
    required_skills: ["medical"],
  },
  {
    title: "Temporary shelter setup",
    category: "shelter",
    zone: "Chennai",
    severity: 4,
    vulnerability_index: 4,
    people_affected: 25,
    volunteer_count_needed: 3,
    required_skills: ["heavy_lifting", "logistics"],
  },
  {
    title: "Sanitation kit distribution",
    category: "sanitation",
    zone: "Kolkata",
    severity: 3,
    vulnerability_index: 4,
    people_affected: 45,
    volunteer_count_needed: 2,
    required_skills: ["logistics"],
  },
  {
    title: "Community livelihood counselling desk",
    category: "livelihood",
    zone: "Ahmedabad",
    severity: 2,
    vulnerability_index: 3,
    people_affected: 20,
    volunteer_count_needed: 1,
    required_skills: ["translation"],
  },
  {
    title: "Elder medication pickup and delivery",
    category: "medical",
    zone: "Mumbai",
    severity: 4,
    vulnerability_index: 5,
    people_affected: 18,
    volunteer_count_needed: 1,
    required_skills: ["medical", "driving"],
  },
  {
    title: "Clean water drums for school shelter",
    category: "water",
    zone: "Lucknow",
    severity: 4,
    vulnerability_index: 4,
    people_affected: 50,
    volunteer_count_needed: 2,
    required_skills: ["driving", "heavy_lifting"],
  },
];

const VOLUNTEERS = [
  {
    full_name: "Aarav Singh",
    email: "aarav.singh@needbridge.org",
    zone: "North Delhi",
    skills: ["driving", "logistics"],
    reliability_score: 92,
  },
  {
    full_name: "Diya Mehta",
    email: "diya.mehta@needbridge.org",
    zone: "Pune",
    skills: ["cooking", "logistics"],
    reliability_score: 88,
  },
  {
    full_name: "Rohan Gupta",
    email: "rohan.gupta@needbridge.org",
    zone: "Bengaluru",
    skills: ["medical"],
    reliability_score: 95,
  },
  {
    full_name: "Isha Nair",
    email: "isha.nair@needbridge.org",
    zone: "Chennai",
    skills: ["heavy_lifting", "logistics"],
    reliability_score: 84,
  },
  {
    full_name: "Kabir Das",
    email: "kabir.das@needbridge.org",
    zone: "Kolkata",
    skills: ["translation", "logistics"],
    reliability_score: 81,
  },
  {
    full_name: "Ananya Rao",
    email: "ananya.rao@needbridge.org",
    zone: "Mumbai",
    skills: ["medical", "driving"],
    reliability_score: 97,
  },
  {
    full_name: "Vikram Patel",
    email: "vikram.patel@needbridge.org",
    zone: "Ahmedabad",
    skills: ["driving", "heavy_lifting"],
    reliability_score: 86,
  },
  {
    full_name: "Meera Joseph",
    email: "meera.joseph@needbridge.org",
    zone: "Lucknow",
    skills: ["cooking", "translation"],
    reliability_score: 83,
  },
];

function calculateUrgencyScore(need) {
  let score =
    need.severity * 15 +
    need.vulnerability_index * 10 +
    need.people_affected * 2;

  if (need.category === "medical") score += 20;
  if (need.category === "food" || need.category === "water") score += 10;

  return Math.min(100, score);
}

async function findAuthUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw error;
  }

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function ensureCoordinatorAuthUser() {
  const existing = await findAuthUserByEmail(COORDINATOR_EMAIL);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: COORDINATOR_EMAIL,
    password: COORDINATOR_PASSWORD,
    email_confirm: true,
    user_metadata: {
      role: "coordinator",
      organization_name: ORGANIZATION_NAME,
    },
  });

  if (error) {
    throw error;
  }

  return data.user;
}

async function ensureOrganization() {
  const { data: existing, error: fetchError } = await supabase
    .from("organizations")
    .select("*")
    .eq("contact_email", ORGANIZATION_EMAIL)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("organizations")
      .update({
        name: ORGANIZATION_NAME,
        type: "ngo",
        verified: true,
        contact_phone: "+91-9876543210",
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updated;
  }

  const { data: created, error: createError } = await supabase
    .from("organizations")
    .insert([
      {
        name: ORGANIZATION_NAME,
        contact_email: ORGANIZATION_EMAIL,
        contact_phone: "+91-9876543210",
        type: "ngo",
        verified: true,
      },
    ])
    .select()
    .single();

  if (createError) {
    throw createError;
  }

  return created;
}

async function ensureVolunteers(organizationId) {
  const volunteerEmails = VOLUNTEERS.map((volunteer) => volunteer.email);

  const { data: existing, error: fetchError } = await supabase
    .from("volunteers")
    .select("email")
    .in("email", volunteerEmails)
    .is("deleted_at", null);

  if (fetchError) {
    throw fetchError;
  }

  const existingEmails = new Set((existing || []).map((row) => row.email));

  const rowsToInsert = VOLUNTEERS.filter(
    (volunteer) => !existingEmails.has(volunteer.email),
  ).map((volunteer, index) => ({
    organization_id: organizationId,
    full_name: volunteer.full_name,
    email: volunteer.email,
    phone: `+91-90000000${String(index + 1).padStart(2, "0")}`,
    zone: volunteer.zone,
    skills: volunteer.skills,
    availability: ["mon_morning", "wed_evening", "sat_morning"],
    radius_km: 15,
    reliability_score: volunteer.reliability_score,
    active: true,
  }));

  if (rowsToInsert.length === 0) {
    const { data: volunteers, error } = await supabase
      .from("volunteers")
      .select("*")
      .in("email", volunteerEmails)
      .is("deleted_at", null);

    if (error) {
      throw error;
    }

    return volunteers || [];
  }

  const { error: insertError } = await supabase
    .from("volunteers")
    .insert(rowsToInsert);

  if (insertError) {
    throw insertError;
  }

  const { data: volunteers, error: refetchError } = await supabase
    .from("volunteers")
    .select("*")
    .in("email", volunteerEmails)
    .is("deleted_at", null);

  if (refetchError) {
    throw refetchError;
  }

  return volunteers || [];
}

async function ensureNeeds(organizationId) {
  const { data: existing, error: fetchError } = await supabase
    .from("needs")
    .select("id")
    .contains("metadata", { seed_batch: SEED_BATCH });

  if (fetchError) {
    throw fetchError;
  }

  if ((existing || []).length > 0) {
    return existing.length;
  }

  const rowsToInsert = NEED_TEMPLATES.map((need, index) => ({
    organization_id: organizationId,
    title: need.title,
    description: `Seeded demo need for ${need.zone}.`,
    category: need.category,
    zone: need.zone,
    severity: need.severity,
    vulnerability_index: need.vulnerability_index,
    people_affected: need.people_affected,
    urgency_score: calculateUrgencyScore(need),
    volunteer_count_needed: need.volunteer_count_needed,
    required_skills: need.required_skills,
    metadata: {
      seed_batch: SEED_BATCH,
      seed_key: `need-${index + 1}`,
      source: "seed-script",
    },
  }));

  const { error: insertError } = await supabase.from("needs").insert(rowsToInsert);

  if (insertError) {
    throw insertError;
  }

  return rowsToInsert.length;
}

async function ensureDemoAssignmentAndOutcome(volunteers, coordinatorUserId) {
  if (volunteers.length === 0) {
    return;
  }

  const { data: seededNeeds, error: needsError } = await supabase
    .from("needs")
    .select("*")
    .contains("metadata", { seed_batch: SEED_BATCH })
    .order("created_at", { ascending: true });

  if (needsError) {
    throw needsError;
  }

  if (!seededNeeds || seededNeeds.length < 3) {
    return;
  }

  const [assignedNeed, inProgressNeed, fulfilledNeed] = seededNeeds;
  const [firstVolunteer, secondVolunteer, thirdVolunteer] = volunteers;

  const assignmentPairs = [
    {
      need_id: assignedNeed.id,
      volunteer_id: firstVolunteer.id,
      assigned_by: `coordinator:${coordinatorUserId}`,
    },
    {
      need_id: inProgressNeed.id,
      volunteer_id: secondVolunteer.id,
      assigned_by: `coordinator:${coordinatorUserId}`,
    },
    {
      need_id: fulfilledNeed.id,
      volunteer_id: thirdVolunteer.id,
      assigned_by: `coordinator:${coordinatorUserId}`,
    },
  ];

  for (const pair of assignmentPairs) {
    const { data: existing, error: existingError } = await supabase
      .from("assignments")
      .select("*")
      .eq("need_id", pair.need_id)
      .eq("volunteer_id", pair.volunteer_id)
      .limit(1);

    if (existingError) {
      throw existingError;
    }

    if (!existing || existing.length === 0) {
      const { error: insertError } = await supabase.from("assignments").insert([
        {
          ...pair,
          status: "pending",
        },
      ]);

      if (insertError) {
        throw insertError;
      }
    }
  }

  async function getAssignment(needId, volunteerId) {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("need_id", needId)
      .eq("volunteer_id", volunteerId)
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  const pendingAssignment = await getAssignment(assignedNeed.id, firstVolunteer.id);
  const enRouteAssignment = await getAssignment(inProgressNeed.id, secondVolunteer.id);
  const completedAssignment = await getAssignment(fulfilledNeed.id, thirdVolunteer.id);

  if (pendingAssignment) {
    const { error } = await supabase
      .from("needs")
      .update({ status: "assigned" })
      .eq("id", assignedNeed.id);

    if (error) {
      throw error;
    }
  }

  if (enRouteAssignment) {
    const acceptedAt = new Date(
      new Date(enRouteAssignment.assigned_at).getTime() + 1000,
    ).toISOString();

    const { error: assignmentUpdateError } = await supabase
      .from("assignments")
      .update({
        status: "on_site",
        accepted_at: acceptedAt,
      })
      .eq("id", enRouteAssignment.id);

    if (assignmentUpdateError) {
      throw assignmentUpdateError;
    }

    const { error: needUpdateError } = await supabase
      .from("needs")
      .update({ status: "in_progress" })
      .eq("id", inProgressNeed.id);

    if (needUpdateError) {
      throw needUpdateError;
    }
  }

  if (completedAssignment) {
    const acceptedAt = new Date(
      new Date(completedAssignment.assigned_at).getTime() + 1000,
    ).toISOString();
    const completedAt = new Date(
      new Date(completedAssignment.assigned_at).getTime() + 2000,
    ).toISOString();

    const { error: assignmentUpdateError } = await supabase
      .from("assignments")
      .update({
        status: "completed",
        accepted_at: acceptedAt,
        completed_at: completedAt,
      })
      .eq("id", completedAssignment.id);

    if (assignmentUpdateError) {
      throw assignmentUpdateError;
    }

    const refreshedCompletedAssignment = await getAssignment(
      fulfilledNeed.id,
      thirdVolunteer.id,
    );

    if (!refreshedCompletedAssignment || refreshedCompletedAssignment.status !== "completed") {
      throw new Error("Failed to move seeded assignment into completed status.");
    }

    const { data: outcome, error: outcomeLookupError } = await supabase
      .from("outcomes")
      .select("id")
      .eq("assignment_id", refreshedCompletedAssignment.id)
      .maybeSingle();

    if (outcomeLookupError) {
      throw outcomeLookupError;
    }

    if (!outcome) {
      const { error: outcomeInsertError } = await supabase.from("outcomes").insert([
        {
          assignment_id: refreshedCompletedAssignment.id,
          need_met: true,
          volunteer_rating: 5,
          feedback: "Seeded successful completion for demo dashboard.",
          impact_data: {
            beneficiaries_served: 18,
            seed_batch: SEED_BATCH,
          },
          recorded_by: coordinatorUserId,
        },
      ]);

      if (outcomeInsertError) {
        throw outcomeInsertError;
      }
    }
  }
}

async function seedDatabase() {
  console.log("Starting Supabase seed...");

  const coordinatorUser = await ensureCoordinatorAuthUser();
  console.log(`Coordinator auth user ready: ${COORDINATOR_EMAIL}`);

  const organization = await ensureOrganization();
  console.log(`Organization ready: ${organization.name}`);

  const volunteers = await ensureVolunteers(organization.id);
  console.log(`Volunteers ready: ${volunteers.length}`);

  const needsCount = await ensureNeeds(organization.id);
  console.log(`Seeded needs batch ready: ${needsCount}`);

  await ensureDemoAssignmentAndOutcome(volunteers, coordinatorUser.id);
  console.log("Assignments and outcome ready.");

  console.log("");
  console.log("Use these coordinator credentials in the frontend login:");
  console.log(`Email: ${COORDINATOR_EMAIL}`);
  console.log(`Password: ${COORDINATOR_PASSWORD}`);
}

seedDatabase().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
