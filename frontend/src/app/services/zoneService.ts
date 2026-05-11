const API_URL = 'http://localhost:5000/zones';
const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

export const getZones = () =>
  fetch(API_URL, { headers: getHeaders() }).then((res) => res.json());
export const getZoneById = (id: string) =>
  fetch(`${API_URL}/${id}`, { headers: getHeaders() }).then((res) =>
    res.json(),
  );
