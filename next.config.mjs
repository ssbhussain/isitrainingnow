/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      // Must stay ahead of the :slug.html wildcard, or /index.html becomes /rain/index.
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/new-york-city.html",
        destination: "/rain/new-york-city",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/los-angeles.html",
        destination: "/rain/los-angeles",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/seattle.html",
        destination: "/rain/seattle",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/london.html",
        destination: "/rain/london",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/manchester.html",
        destination: "/rain/manchester",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/birmingham.html",
        destination: "/rain/birmingham",
        permanent: true,
        statusCode: 301,
      },
      {
        source: "/:slug.html",
        destination: "/rain/:slug",
        permanent: true,
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
