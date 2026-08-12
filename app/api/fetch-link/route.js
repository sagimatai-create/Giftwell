// Runs on the server (not the browser), so it isn't blocked by CORS the way
// a client-side fetch would be. Reads Open Graph / meta tags from the page.
export async function POST(req) {
  const { url } = await req.json();
  if (!url) return Response.json({ error: "Missing url" }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GiftwellBot/1.0)" },
    });
    const html = await res.text();

    const getMeta = (prop) => {
      const re = new RegExp(
        `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
        "i"
      );
      const match = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
      return match ? match[1] : null;
    };

    const title = getMeta("og:title") || getMeta("twitter:title");
    const image = getMeta("og:image") || getMeta("twitter:image");
    const priceRaw =
      getMeta("product:price:amount") ||
      getMeta("og:price:amount") ||
      getMeta("twitter:data1");
    const price = priceRaw ? parseFloat(String(priceRaw).replace(/[^0-9.]/g, "")) : null;

    if (!title && !image) {
      return Response.json(
        { error: "Couldn't find product info on that page. This store may block automated reads — try entering details manually." },
        { status: 422 }
      );
    }

    return Response.json({ title, image, price });
  } catch (e) {
    return Response.json(
      { error: "Couldn't reach that link. Double check it's correct, or enter details manually." },
      { status: 500 }
    );
  }
}
