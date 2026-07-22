/**
 * Utility to safely load the Razorpay Checkout SDK script on-demand in React.
 * Prevents duplicate script tags and race conditions.
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // 1. If Razorpay is already available on window object, resolve immediately
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // 2. Check if a script tag already exists in the document
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    // 3. Dynamically inject the script tag if not present
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
