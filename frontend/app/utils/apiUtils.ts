export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  return response.json();
};
