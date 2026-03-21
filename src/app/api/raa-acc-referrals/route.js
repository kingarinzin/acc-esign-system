import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

// ---------------- HELPER ----------------
async function getCollection() {
  const client = await clientPromise;
  const db = client.db(); // uses DB from URI
  return db.collection("raa_acc_referrals"); // make sure this matches MongoDB collection name
}

// ---------------- GET ----------------
export async function GET() {
  try {
    const collection = await getCollection();
    const referrals = await collection.find({}).toArray();
    return new Response(JSON.stringify(referrals), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// ---------------- POST ----------------
export async function POST(req) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.year || !body.crn) {
      return new Response(JSON.stringify({ error: "Year and CRN are required" }), { status: 400 });
    }

    const doc = {
      year: body.year,
      crn: body.crn,
      alleged: body.alleged || "",
      sharing_letter_no: body.sharing_letter_no || "",
      referral_date: body.referral_date || null,
      status: "Pending",
    };

    const collection = await getCollection();
    const result = await collection.insertOne(doc);
    const inserted = await collection.findOne({ _id: result.insertedId });

    return new Response(JSON.stringify(inserted), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// ---------------- PUT ----------------
export async function PUT(req) {
  try {
    const body = await req.json();

    if (!body._id) {
      return new Response(JSON.stringify({ error: "ID is required" }), { status: 400 });
    }

    const updateDoc = {
      year: body.year,
      crn: body.crn,
      alleged: body.alleged || "",
      sharing_letter_no: body.sharing_letter_no || "",
      referral_date: body.referral_date || null,
      status: body.status || "Pending",
    };

    const collection = await getCollection();
    await collection.updateOne({ _id: new ObjectId(body._id) }, { $set: updateDoc });
    const updated = await collection.findOne({ _id: new ObjectId(body._id) });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// ---------------- DELETE ----------------
export async function DELETE(req) {
  try {
    const body = await req.json();

    if (!body._id) {
      return new Response(JSON.stringify({ error: "ID is required" }), { status: 400 });
    }

    const collection = await getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(body._id) });

    return new Response(JSON.stringify({ deletedCount: result.deletedCount }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}