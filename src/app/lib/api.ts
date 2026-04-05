export const BACKEND_PROXY_BASE = "/api/backend";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface AuthUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  token: string | null;
}

export interface AuthResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  requiresVerification?: boolean;
  user?: AuthUser;
  email?: string;
}

export interface BackendUserDto {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: string;
  token: string | null;
}

export interface BackendServiceDto {
  id: number;
  serviceName: string;
  category: string;
  price: number;
  isAvailable: boolean;
}

export interface BackendLaundryDto {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  availability: string;
  averageRating: number;
  totalReviews: number;
  services: BackendServiceDto[];
}

export interface BackendOrderItemDto {
  serviceId: number;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BackendPaymentDto {
  id: number;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
  paymentDate: string | null;
  checkoutUrl?: string; // Added for Kashier
}

export interface KashierResponseDto {
  orderId: string;
  checkoutUrl: string;
}

export interface BackendOrderDto {
  id: number;
  status: string;
  totalPrice: number;
  pickupTime: string;
  deliveryTime: string | null;
  pickupLocation: string;
  deliveryLocation: string;
  notes: string | null;
  cancellationReason: string | null;
  createdAt: string;
  laundryName: string;
  items: BackendOrderItemDto[];
  payment: BackendPaymentDto | null;
}

export interface BackendOrderTrackDto {
  orderId: number;
  status: string;
  laundryName: string;
  laundryAddress: string;
  pickupTime: string;
  deliveryTime: string | null;
  estimatedDeliveryTime: string | null;
  courierLatitude: number | null;
  courierLongitude: number | null;
}

export interface PaginatedResponse<T> {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  data: T[];
}

export interface UiServiceItem {
  id: string;
  name: string;
  category: "wash" | "dry_clean" | "iron" | "specialty";
  price: number;
  unit: string;
  available: boolean;
  turnaround?: string;
}

export interface UiLaundry {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  deliveryTime: string;
  distance: number;
  distanceLabel: string;
  status: "active" | "inactive";
  isAvailable: boolean;
  address: string;
  services: UiServiceItem[];
  latitude: number;
  longitude: number;
  availability: string;
}

export type UiOrderStatus =
  | "pending_confirmation"
  | "accepted"
  | "washing"
  | "ready_for_pickup"
  | "picked_up"
  | "delivered"
  | "cancelled";

export interface UiOrder {
  id: string;
  status: UiOrderStatus;
  total: number;
  pickupAt: string;
  deliveryAt: string | null;
  pickupDate: string;
  pickupTime: string;
  pickupAddress: string;
  deliveryAddress: string;
  laundryName: string;
  serviceName: string;
  serviceUnit: string;
  itemCount: number;
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  cancellationReason: string | null;
}

export interface VerifyEmailResponse {
  token: string;
}

export interface MessageResponse {
  message: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
}

export const categoryLabels: Record<string, string> = {
  wash: "Wash & Fold",
  iron: "Ironing",
  dry_clean: "Dry Cleaning",
  specialty: "Specialty Items",
};

export const categoryOrder = ["wash", "iron", "dry_clean", "specialty"];

export const statusOrder: UiOrderStatus[] = [
  "pending_confirmation",
  "accepted",
  "washing",
  "ready_for_pickup",
  "picked_up",
  "delivered",
];

export const statusConfig: Record<
  UiOrderStatus,
  { label: string; color: string; bg: string; description: string }
> = {
  pending_confirmation: {
    label: "Pending Confirmation",
    color: "#EBA050",
    bg: "#FFF7ED",
    description: "Waiting for the laundry to accept your order.",
  },
  accepted: {
    label: "Accepted",
    color: "#1D6076",
    bg: "#EFF8FB",
    description:
      "The laundry has accepted your order and is preparing for pickup.",
  },
  washing: {
    label: "Being Washed",
    color: "#2a7a94",
    bg: "#E8F4F8",
    description: "Your items are currently being cleaned.",
  },
  ready_for_pickup: {
    label: "Ready for Delivery",
    color: "#059669",
    bg: "#ECFDF5",
    description: "Your items are clean and ready. A driver is being assigned.",
  },
  picked_up: {
    label: "On the Way",
    color: "#7c3aed",
    bg: "#F5F3FF",
    description: "Your items have been picked up and are on their way to you.",
  },
  delivered: {
    label: "Delivered",
    color: "#059669",
    bg: "#ECFDF5",
    description: "Your order has been delivered successfully.",
  },
  cancelled: {
    label: "Cancelled",
    color: "#DC2626",
    bg: "#FEF2F2",
    description: "This order has been cancelled.",
  },
};

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=1200&q=80",
];

function getErrorMessage(data: unknown, fallback = "Request failed.") {
  if (!data) return fallback;

  if (typeof data === "string") return data;

  if (typeof data === "object") {
    const record = data as Record<string, unknown>;

    if (typeof record.message === "string") return record.message;
    if (typeof record.Message === "string") return record.Message;
    if (typeof record.title === "string") return record.title;

    const errors = record.errors;
    if (errors && typeof errors === "object") {
      const first = Object.values(errors as Record<string, unknown>)[0];
      if (Array.isArray(first) && typeof first[0] === "string") {
        return first[0];
      }
    }
  }

  return fallback;
}

function looksLikeHtml(text: string) {
  const trimmed = text.trim().toLowerCase();
  return (
    trimmed.startsWith("<!doctype html") ||
    trimmed.startsWith("<html") ||
    trimmed.includes("<title>site under construction</title>")
  );
}

async function request<T>(
  path: string,
  init?: RequestInit,
  token?: string | null,
): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!headers.has("accept")) {
    headers.set("accept", "application/json");
  }

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${BACKEND_PROXY_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;
  const receivedHtml = typeof data === "string" && looksLikeHtml(data);

  if (!response.ok) {
    const status500Or502 =
      response.status === 500 || response.status === 502 || response.status === 503;
    throw new ApiError(
      getErrorMessage(
        receivedHtml
          ? {
              message:
                "The backend returned an HTML placeholder page instead of API JSON. Verify NDEEF_BACKEND_URL.",
            }
          : status500Or502 && !data
            ? {
                message:
                  "Login is unavailable right now because the app could not reach the backend service.",
              }
          : data,
        `Request failed with status ${response.status}.`,
      ),
      response.status,
      data,
    );
  }

  if (receivedHtml) {
    throw new ApiError(
      "The backend returned an HTML page instead of API JSON. Verify NDEEF_BACKEND_URL.",
      502,
      data,
    );
  }

  return data as T;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function normalizeBase64(input: string) {
  const padded = input.padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  return padded.replace(/-/g, "+").replace(/_/g, "/");
}

function parseJwtPayload(token: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const decoded = atob(normalizeBase64(payload));
    return JSON.parse(decoded) as Record<string, string>;
  } catch {
    return null;
  }
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || parts[0] || "";
  return { firstName, lastName };
}

export function mapUserDtoToAuthUser(user: BackendUserDto): AuthUser {
  const { firstName, lastName } = splitName(user.name);
  return {
    id: user.id,
    name: user.name,
    firstName,
    lastName,
    email: user.email,
    phone: user.phoneNumber ?? "",
    role: user.role,
    token: user.token,
  };
}

export function mapTokenToAuthUser(
  token: string,
  fallback?: Partial<AuthUser>,
): AuthUser {
  const payload = parseJwtPayload(token);
  const name = payload?.Name ?? payload?.name ?? fallback?.name ?? "Nadeef User";
  const email = payload?.email ?? fallback?.email ?? "";
  const role = payload?.role ?? fallback?.role ?? "";
  const id = payload?.uid ?? payload?.sub ?? fallback?.id ?? "";
  const { firstName, lastName } = splitName(name);

  return {
    id,
    name,
    firstName,
    lastName,
    email,
    phone: fallback?.phone ?? "",
    role,
    token,
  };
}

function toUiCategory(category: string): UiServiceItem["category"] {
  switch (category) {
    case "Wash":
      return "wash";
    case "DryCleaning":
      return "dry_clean";
    case "Iron":
      return "iron";
    default:
      return "specialty";
  }
}

function haversineDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDeliveryTime(distanceKm: number) {
  const minutes = Math.max(45, Math.round(distanceKm * 20 + 40));
  if (minutes < 60) return `${minutes} mins`;
  return `${(minutes / 60).toFixed(1)} hours`;
}

export function mapLaundryDtoToUiLaundry(
  laundry: BackendLaundryDto,
  coords?: { lat: number; lng: number },
): UiLaundry {
  const distance = coords
    ? haversineDistanceKm(
        coords.lat,
        coords.lng,
        Number(laundry.latitude),
        Number(laundry.longitude),
      )
    : 0;

  return {
    id: String(laundry.id),
    name: laundry.name,
    image: PLACEHOLDER_IMAGES[laundry.id % PLACEHOLDER_IMAGES.length],
    rating: Number(laundry.averageRating ?? 0),
    reviews: Number(laundry.totalReviews ?? 0),
    deliveryTime: estimateDeliveryTime(distance || 1.5),
    distance,
    distanceLabel: coords ? `${distance.toFixed(1)} km` : "Nearby",
    status: laundry.status === "Active" ? "active" : "inactive",
    isAvailable: laundry.availability === "Open",
    address: laundry.address,
    latitude: Number(laundry.latitude),
    longitude: Number(laundry.longitude),
    availability: laundry.availability,
    services: (laundry.services ?? []).map((service) => ({
      id: String(service.id),
      name: service.serviceName,
      category: toUiCategory(service.category),
      price: Number(service.price),
      unit: "per item",
      available: service.isAvailable,
    })),
  };
}

export function mapBackendStatusToUiStatus(status: string): UiOrderStatus {
  switch (status) {
    case "PendingConfirmation":
      return "pending_confirmation";
    case "Accepted":
      return "accepted";
    case "Washing":
      return "washing";
    case "ReadyForPickup":
      return "ready_for_pickup";
    case "PickedUp":
      return "picked_up";
    case "Delivered":
      return "delivered";
    default:
      return "cancelled";
  }
}

function mapBackendPaymentStatus(
  status?: string | null,
): UiOrder["paymentStatus"] {
  switch (status) {
    case "Paid":
      return "paid";
    case "Failed":
      return "failed";
    default:
      return "pending";
  }
}

function formatRelativeDate(dateIso: string) {
  const target = new Date(dateIso);
  const now = new Date();
  const targetDate = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";

  return target.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateIso: string) {
  return new Date(dateIso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function mapOrderDtoToUiOrder(order: BackendOrderDto): UiOrder {
  const itemCount = order.items.reduce(
    (sum, item) => sum + Number(item.quantity ?? 0),
    0,
  );
  const firstItem = order.items[0];

  return {
    id: String(order.id),
    status: mapBackendStatusToUiStatus(order.status),
    total: Number(order.totalPrice ?? 0),
    pickupAt: order.pickupTime,
    deliveryAt: order.deliveryTime,
    pickupDate: formatRelativeDate(order.pickupTime),
    pickupTime: formatTime(order.pickupTime),
    pickupAddress: order.pickupLocation,
    deliveryAddress: order.deliveryLocation,
    laundryName: order.laundryName,
    serviceName:
      order.items.length <= 1
        ? firstItem?.serviceName ?? "Laundry Service"
        : `${order.items.length} services`,
    serviceUnit: itemCount === 1 ? "item" : "items",
    itemCount,
    paymentStatus: mapBackendPaymentStatus(order.payment?.paymentStatus),
    createdAt: order.createdAt,
    updatedAt: order.payment?.paymentDate ?? order.createdAt,
    notes: order.notes,
    cancellationReason: order.cancellationReason,
  };
}

export async function loginRequest(email: string, password: string) {
  return request<BackendUserDto>("/Auth/login", {
    method: "POST",
    body: JSON.stringify({ Email: email, Password: password }),
  });
}

export async function googleLoginRequest(idToken: string) {
  return request<BackendUserDto>("/Auth/google-login", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function registerRequest(payload: {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: "Customer";
}) {
  return request<BackendUserDto>("/Auth/register", {
    method: "POST",
    body: JSON.stringify({
      Name: payload.name,
      Email: payload.email,
      Password: payload.password,
      PhoneNumber: payload.phoneNumber,
      Role: payload.role,
    }),
  });
}

export async function verifyEmailRequest(email: string, otpCode: string) {
  return request<VerifyEmailResponse>("/Auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ Email: email, OtpCode: otpCode }),
  });
}

export async function forgotPasswordRequest(email: string) {
  return request<MessageResponse>("/Auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ Email: email }),
  });
}

export async function resetPasswordRequest(payload: {
  email: string;
  otpCode: string;
  newPassword: string;
}) {
  return request<MessageResponse>("/Auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      Email: payload.email,
      OtpCode: payload.otpCode,
      NewPassword: payload.newPassword,
    }),
  });
}

export async function getLaundriesRequest(params?: {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  availability?: string;
  minRating?: number;
  sortBy?: string;
}) {
  const query = new URLSearchParams();
  if (params?.pageIndex) query.set("PageIndex", String(params.pageIndex));
  if (params?.pageSize) query.set("PageSize", String(params.pageSize));
  if (params?.search) query.set("Search", params.search);
  if (params?.availability) query.set("Availability", params.availability);
  if (params?.minRating) query.set("MinRating", String(params.minRating));
  if (params?.sortBy) query.set("SortBy", params.sortBy);

  return request<PaginatedResponse<BackendLaundryDto>>(
    `/Laundries${query.toString() ? `?${query.toString()}` : ""}`,
  );
}

export async function searchLaundriesRequest(params: {
  q?: string;
  lat: number;
  lng: number;
  radius?: number;
  pageIndex?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  query.set("Lat", String(params.lat));
  query.set("Lng", String(params.lng));
  if (params.q) query.set("Q", params.q);
  if (params.radius) query.set("Radius", String(params.radius));
  if (params.pageIndex) query.set("PageIndex", String(params.pageIndex));
  if (params.pageSize) query.set("PageSize", String(params.pageSize));

  return request<PaginatedResponse<BackendLaundryDto>>(
    `/Laundries/search?${query.toString()}`,
  );
}

export async function getLaundryRequest(id: string | number) {
  return request<BackendLaundryDto>(`/Laundries/${id}`);
}

export async function getLaundryServicesRequest(id: string | number) {
  return request<BackendServiceDto[]>(`/Laundries/${id}/services`);
}

export async function calculatePriceRequest(
  token: string,
  payload: {
    laundryId: number;
    items: { serviceId: number; quantity: number }[];
  },
) {
  return request<{ totalPrice: number; items: BackendOrderItemDto[] }>(
    "/Orders/calculate-price",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function placeOrderRequest(
  token: string,
  payload: {
    laundryId: number;
    items: { serviceId: number; quantity: number }[];
    pickupTime: string;
    deliveryTime: string | null;
    pickupLocation: string;
    deliveryLocation: string;
    notes?: string | null;
  },
) {
  return request<BackendOrderDto>(
    "/Orders",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function getOrdersRequest(
  token: string,
  pageIndex = 1,
  pageSize = 100,
) {
  return request<PaginatedResponse<BackendOrderDto>>(
    `/Orders?PageIndex=${pageIndex}&PageSize=${pageSize}`,
    undefined,
    token,
  );
}

export async function getOrderByIdRequest(token: string, id: string | number) {
  return request<BackendOrderDto>(`/Orders/${id}`, undefined, token);
}

export async function trackOrderRequest(token: string, id: string | number) {
  return request<BackendOrderTrackDto>(`/Orders/${id}/track`, undefined, token);
}

export async function cancelOrderRequest(
  token: string,
  id: string | number,
  cancellationReason?: string,
) {
  return request<{ message: string }>(
    `/Orders/${id}/cancel`,
    {
      method: "PUT",
      body: JSON.stringify({
        cancellationReason: cancellationReason ?? "Cancelled by customer",
      }),
    },
    token,
  );
}

export async function processPaymentRequest(
  token: string,
  payload: {
    orderId: number;
    amount: number;
    paymentMethod: "CreditCard" | "MobilePayment";
  },
) {
  // This calls /api/wallet/pay/mobile-wallet/{orderId} or the card endpoint
  // For Kashier Hosted Page (card), we use the mobile-wallet endpoint which internally
  // calls CreateCardPaymentAsync and returns a checkoutUrl
  return request<KashierResponseDto>(
    `/wallet/pay/mobile-wallet/${payload.orderId}`,
    {
      method: "POST",
      body: JSON.stringify({ amount: payload.amount }),
    },
    token,
  );
}

export async function payWithCashRequest(
  token: string,
  orderId: number,
  amount: number,
) {
  return request<{ message: string }>(
    `/wallet/pay/cash/${orderId}`,
    {
      method: "POST",
      body: JSON.stringify({ amount }),
    },
    token,
  );
}

export async function chargeWalletRequest(
  token: string,
  amount: number,
) {
  return request<KashierResponseDto>(
    "/wallet/charge",
    {
      method: "POST",
      body: JSON.stringify({ amount }),
    },
    token,
  );
}

export async function getWalletBalanceRequest(token: string) {
  return request<{ balance: number }>("/wallet/balance", undefined, token);
}

export async function changePasswordRequest(
  token: string,
  payload: { currentPassword: string; newPassword: string; confirmPassword: string },
) {
  return request<{ message: string }>(
    "/User/change-password",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function sendChatMessageRequest(
  token: string,
  payload: {
    message: string;
    history: ChatMessage[];
  },
) {
  const response = await fetch(`${BACKEND_PROXY_BASE}/chat`, {
    method: "POST",
    headers: {
      accept: "text/event-stream",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      message: payload.message,
      history: payload.history.map((entry) => ({
        role: entry.role,
        content: entry.content,
        createdAt: entry.createdAt,
      })),
    }),
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    const text = await response.text();
    const data = text ? safeJsonParse(text) : null;
    throw new ApiError(
      getErrorMessage(data, `Request failed with status ${response.status}.`),
      response.status,
      data,
    );
  }

  return response.body;
}

