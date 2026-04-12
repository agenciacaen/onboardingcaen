
const token = "EAAqKJCW6TZBQBREvFhH87JONXHCboZCDLfmxCueaGK4E7qrE8iCx4lmBEDSdGA6Mp6gKrhBs70IZC6EzAXw6fr79RSZCESpZCZCdRf8XCs3qujzEbIO1ZAPRwZBKWc5Dr0tHCs7JehxtCApr9SwconaZBBxQWmC2T4NZCJtcZBbtytdSwxKhXhdsLTX2YILg34zDgZDZD";
// Usando um ID de conta qualquer para testar o token (ou apenas o endpoint /me)
const url = `https://graph.facebook.com/v21.0/me?access_token=${token}`;

async function testToken() {
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

testToken();
