const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// Load .env from root directory
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials!");
  console.error(
    "Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("✅ Supabase client initialized");

module.exports = supabase;
