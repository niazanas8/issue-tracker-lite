import axios from "axios";

export const API_BASE =
  process.env.REACT_APP_LOCAL_API_URL || "http://localhost:3001/";

/** Read a cookie by name */
export const getCookie = (name: string) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

interface RequestFunction {
  (url: string, options?: { method?: string; body?: object }): Promise<any>;
}

/** Thin wrapper around axios with AuthToken/Email headers */
export const request: RequestFunction = async (url, options = {}) => {
  let method = options.method?.toLowerCase() || "get";
  const body = options.body ?? null;

  try {
    if (method === "get") {
      const response = await axios.get(API_BASE + url, {
        headers: {
          "x-access-token": getCookie("AuthToken")!,
          email: getCookie("Email")!,
        },
      });
      return response.data;
    }

    if (method === "post") {
      const response = await axios.post(API_BASE + url, body, {
        headers: {
          "x-access-token": getCookie("AuthToken")!,
          email: getCookie("Email")!,
        },
      });
      return response.data;
    }

    // Optional: support other verbs if you ever need them
    const response = await axios({
      url: API_BASE + url,
      method: method as any,
      data: body,
      headers: {
        "x-access-token": getCookie("AuthToken")!,
        email: getCookie("Email")!,
      },
    });
    return response.data;
  } catch (err: any) {
    // Network errors
    if (err instanceof TypeError) {
      const networkError = `${err}`.toLowerCase();
      if (networkError.includes("networkerror")) {
        throw new Error("Check Internet Connectivity");
      }
    }
    // Axios/server errors
    if (err?.response?.data) throw err.response.data;
    if (err?.message) throw err.message;
    throw JSON.parse(err);
  }
};

/** Clear Cache Storage */
const clearCacheData = () => {
  caches.keys().then((names) => {
    names.forEach((name) => {
      caches.delete(name);
    });
  });
};

/** Delete all cookies for app paths */
const deleteAllCookies = () => {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;

    // Clear cookies for path /issue-tracker-lite
    document.cookie =
      name +
      "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/issue-tracker-lite";

    // Clear cookies for root path /
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }
};

export const clearAllStorage = () => {
  clearCacheData();
  deleteAllCookies();
  localStorage.clear();
  sessionStorage.clear();
};

export const logout = () => {
  clearAllStorage();
  if (!document.cookie) {
    window.location.reload();
  }
};

export const formatDate = (rawDate: Date) => {
  const date = new Date(rawDate);
  const year = date.getFullYear();
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const day = String(date.getDate()).padStart(2, "0");
  return `${month} ${day} ${year}`;
};

export const countTicketsPerProject = (tickets: any) => {
  const ticketCount: { [key: string]: number } = {};
  const newTicketCount: { [key: string]: number } = {};
  const inProgressCount: { [key: string]: number } = {};
  const resolvedCount: { [key: string]: number } = {};

  for (let i = 0; i < tickets.length; i++) {
    const project = tickets[i].project;

    // Total Ticket Count
    ticketCount[project] = (ticketCount[project] || 0) + 1;

    // New Ticket Count
    if (tickets[i].status === "new") {
      newTicketCount[project] = (newTicketCount[project] || 0) + 1;
    }

    // In Progress Count
    if (tickets[i].status === "in progress") {
      inProgressCount[project] = (inProgressCount[project] || 0) + 1;
    }

    // Resolved Count
    if (tickets[i].status === "resolved") {
      resolvedCount[project] = (resolvedCount[project] || 0) + 1;
    }
  }

  const result = [];
  for (const project in ticketCount) {
    result.push({
      id: project,
      label: project,
      value: ticketCount[project],
      tickets: {
        new: newTicketCount[project] || 0,
        inProgress: inProgressCount[project] || 0,
        resolved: resolvedCount[project] || 0,
      },
    });
  }
  return result;
};

interface OutputObject {
  id: string;
  data: { x: string; y: number }[];
}

export const formatTicketDistribution = (input: any): OutputObject[] => {
  const result: OutputObject[] = [];

  // Group objects by project and type
  const groupedData: { [type: string]: { [project: string]: number } } = {};

  for (const obj of input) {
    if (!(obj.type in groupedData)) groupedData[obj.type] = {};
    if (!(obj.project in groupedData[obj.type]))
      groupedData[obj.type][obj.project] = 0;
    groupedData[obj.type][obj.project]++;
  }

  // Get unique projects
  const projects = input
    .map((obj: any) => obj.project)
    .filter(
      (value: any, index: number, self: any) => self.indexOf(value) === index
    );

  // Transform grouped data into the desired format
  for (const type in groupedData) {
    const data: { x: string; y: number }[] = [];
    for (const project of projects) {
      const count = groupedData[type][project] || 0;
      data.push({ x: project, y: count });
    }
    result.push({ id: type, data: data.reverse() });
  }

  // Calculate total number of tickets per project (kept for future use)
  // const totalData: { x: string; y: number }[] = [];
  // for (const project of projects) {
  //   const totalCount = input.filter((obj: any) => obj.project === project).length;
  //   totalData.push({ x: project, y: totalCount });
  // }
  // result.unshift({ id: "Total Tickets", data: totalData });

  return result.reverse();
};
