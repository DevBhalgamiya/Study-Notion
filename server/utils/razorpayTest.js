const axios = require("axios");

const RAZORPAY_KEY = "rzp_test_i4Emiav1Uwb1e7";
const RAZORPAY_SECRET = "UOID3BsKROIISIg6VhXCaesA";

const basicAuth = Buffer.from(`${RAZORPAY_KEY}:${RAZORPAY_SECRET}`).toString("base64");

axios
  .get("https://api.razorpay.com/v1/payments", {
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
  })
  .then(response => {
    console.log("API Request Successful:", response.data);
  })
  .catch(error => {
    console.error("API Request Failed:", error.response ? error.response.data : error.message);
  });
