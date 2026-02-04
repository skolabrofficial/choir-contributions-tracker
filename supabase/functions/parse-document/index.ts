import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "members" or "payments"

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read file content
    const text = await file.text();
    
    // Use Lovable AI Gateway to parse the content
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let prompt = "";
    if (type === "members") {
      prompt = `Analyze this text and extract a list of choir members. For each person found, extract their first name and last name.

Return ONLY a valid JSON array with objects containing:
- first_name: string
- last_name: string

Example output:
[{"first_name": "Marie", "last_name": "Nováková"}, {"first_name": "Jan", "last_name": "Novák"}]

Text to analyze:
${text}

Return ONLY the JSON array, no other text.`;
    } else {
      prompt = `Analyze this text and extract payment information for choir members. Look for names and which months they have paid (Czech months: září, říjen, listopad, prosinec, leden, únor, březen, duben, květen, červen).

Return ONLY a valid JSON array with objects containing:
- name: full name of the person
- months: array of month numbers that are paid (9=září, 10=říjen, 11=listopad, 12=prosinec, 1=leden, 2=únor, 3=březen, 4=duben, 5=květen, 6=červen)

If someone has "zaplaceno vše" or "celý rok", include all months [9,10,11,12,1,2,3,4,5,6].

Example output:
[{"name": "Marie Nováková", "months": [9, 10, 11]}, {"name": "Jan Novák", "months": [9, 10, 11, 12, 1, 2, 3, 4, 5, 6]}]

Text to analyze:
${text}

Return ONLY the JSON array, no other text.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to parse document" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "[]";
    
    // Try to extract JSON from the response
    let parsedData;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      parsedData = [];
    }

    return new Response(
      JSON.stringify({ data: parsedData, type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing file:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
