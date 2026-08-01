# Module Naming Convention

> Module architecture & naming convention rút ra từ `chek-my-branding-app`, áp dụng được cho mọi project React/Next.js/React Router.

---

## 1. Tổng quan kiến trúc

```
src/
├── app/          ← Routing layer (pages, layouts)
├── core/         ← Core infrastructure (api client, base classes)
├── features/     ← Business modules (users, auth, dashboard, …)
├── components/   ← Shared UI (layout, custom)
├── shared/       ← Code dùng chung nhiều features
├── hooks/        ← Generic hooks (app-level)
├── stores/       ← Zustand stores
├── lib/          ← Cross-cutting libs (auth, authorization, data-table, zod)
├── types/        ← Global types
├── utils/        ← App-level utilities
├── helpers/      ← Helper functions
├── exceptions/   ← Custom exception classes
├── config/       ← App config
├── providers/    ← React context providers
├── locales/      ← i18n JSON
├── assets/
└── styles/
```

---

## 2. Cấu trúc feature module

### 2.1 Template chuẩn

```
features/<feature-name>/
├── api/                          ← REST client class
│   └── index.ts
├── hooks/                        ← React Query hooks
│   ├── <sub-feature>/
│   │   ├── useXxxList.ts
│   │   ├── useXxxCreate.ts
│   │   ├── useXxxUpdate.ts
│   │   ├── useXxxDelete.ts
│   │   └── index.ts              ← barrel
│   └── (hoặc file lẻ nếu feature nhỏ)
├── types/                        ← TypeScript types & Zod
│   ├── <entity>.ts
│   └── index.ts
├── components/                   ← Reusable UI components
│   └── <sub-feature>/
│       ├── XxxListComponent.tsx
│       └── DeleteXxxModal.tsx
├── views/                        ← Page-level components
│   └── <sub-feature>/
│       ├── XxxList.tsx
│       └── XxxForm.tsx
├── locales/                      ← i18n riêng feature
│   ├── en.json
│   └── vi.json
├── ui/                           ← (optional) UI đặc thù
└── index.ts                      ← barrel (chỉ export types)
```

### 2.2 Ví dụ thực tế — `features/users/`

```
users/
├── api/index.ts
├── hooks/
│   ├── user/
│   │   ├── useUser.ts
│   │   ├── useUserList.ts
│   │   ├── useCreateUser.ts
│   │   ├── useUserCreation.ts
│   │   ├── useUserUpdate.ts
│   │   ├── useUpdateUser.ts
│   │   ├── useUserDelete.ts
│   │   ├── useChangePassword.ts
│   │   ├── useUpdateProfile.ts
│   │   ├── useResendVerificationEmail.ts
│   │   ├── usePermissions.ts
│   │   ├── useGetUserClass.ts
│   │   └── index.ts
│   ├── role/
│   │   ├── useRole.ts
│   │   ├── useRoleList.ts
│   │   ├── useRoleCreation.ts
│   │   ├── useRoleUpdate.ts
│   │   ├── useRoleDelete.ts
│   │   └── index.ts
│   └── index.ts
├── components/
│   ├── user/
│   │   ├── UserListComponent.tsx
│   │   └── DeleteUserModal.tsx
│   ├── role/
│   │   ├── RoleListComponent.tsx
│   │   ├── GroupTreeComponent.tsx
│   │   └── DeleteRoleModal.tsx
│   └── profile/
│       └── ChangePasswordModal.tsx
├── views/
│   ├── user/
│   │   ├── UsersList.tsx
│   │   ├── UserForm.tsx
│   │   └── ViewProfile.tsx
│   └── role/
│       ├── RoleList.tsx
│       └── RoleForm.tsx
├── types/
│   ├── user.ts
│   ├── role.ts
│   └── index.ts
├── locales/
└── index.ts
```

---

## 3. Quy tắc đặt tên FOLDER

### 3.1 Feature & sub-feature

| Loại | Quy tắc | Ví dụ |
|---|---|---|
| Feature | `kebab-case`, số ít | `users`, `auth`, `cluster-cells` |
| Sub-feature | `kebab-case` / số ít | `user`, `role`, `auditlog` |
| Shared/Common | số ít | `common`, `shared` |

### 3.2 Layer trong feature

**Luôn số ít, không bao giờ số nhiều:**

| Folder | Vai trò |
|---|---|
| `api/` | REST client class |
| `hooks/` | React Query hooks |
| `types/` | TypeScript types & Zod |
| `components/` | UI tái sử dụng |
| `views/` | Page-level components |
| `ui/` | UI đặc thù feature |
| `locales/` | i18n |
| `stores/` | Zustand store |
| `utils/` | Helper trong feature |
| `index.ts` | Barrel export |

---

## 4. Quy tắc đặt tên FILE

### 4.1 Bảng tổng hợp

| Loại file | Convention | Ví dụ |
|---|---|---|
| React component | `PascalCase.tsx` | `UserListComponent.tsx` |
| Hook | `camelCase.ts`, prefix `use` | `useUserList.ts` |
| API client | `index.ts` (trong `api/`) | `features/users/api/index.ts` |
| Types | `camelCase.ts` hoặc theo entity | `user.ts`, `api-error.ts` |
| Barrel export | `index.ts` | `features/users/hooks/user/index.ts` |
| Helper/Util | `camelCase.ts` | `helper.ts`, `colorHelper.ts` |
| Store | `camelCase.ts` | `notifications.ts` |
| Exception | `PascalCase.ts` | `ApiConnectionException.ts` |
| Layout (route) | `layout.tsx` | `app/admin/layout.tsx` |
| Page (route) | `page.tsx` | `app/admin/users/page.tsx` |
| Dynamic route | `[paramName]/page.tsx` | `[userId]/page.tsx` |
| Test | `*.test.ts(x)` | `useDebounce.test.ts` |

### 4.2 Quy tắc đặt tên component theo vai trò

| Pattern | Dùng khi | Ví dụ |
|---|---|---|
| `XxxListComponent` | Bảng/danh sách thuần (tái sử dụng) | `UserListComponent` |
| `XxxList` | Page wrapper (có breadcrumb, layout) | `UsersList` |
| `XxxForm` | Form create/edit | `UserForm`, `RoleForm` |
| `DeleteXxxModal` | Modal xác nhận xoá | `DeleteUserModal` |
| `XxxModal` | Modal khác | `ChangePasswordModal` |
| `XxxLayout` | Layout wrapper | `ContentLayout`, `AuthLayout` |
| `XxxView` | View-level component | `ViewProfile` |

### 4.3 Phân biệt `views/` vs `components/`

```
features/users/
├── components/user/
│   ├── UserListComponent.tsx    ← thuần UI, nhận props
│   └── DeleteUserModal.tsx
└── views/user/
    ├── UsersList.tsx            ← page wrapper: layout + breadcrumb + mount component
    └── UserForm.tsx
```

```tsx
// views/user/UsersList.tsx — page wrapper
export const UsersList = () => (
  <ContentLayout title="...">
    <UserListComponent />
  </ContentLayout>
)

// components/user/UserListComponent.tsx — bảng + filter + actions
export const UserListComponent = () => {
  const { data } = useUserList()
  // ...
}
```

---

## 5. Quy tắc đặt tên BIẾN, HÀM, CLASS, TYPE

### 5.1 Biến

| Loại | Convention | Ví dụ |
|---|---|---|
| Biến thường | `camelCase` | `userName`, `userData`, `deleteUser` |
| Boolean | prefix `is` / `has` / `should` / `can` | `isLoading`, `isActive`, `hasPermission` |
| Hằng số env/config | `UPPER_SNAKE_CASE` | `API_URL`, `VITE_CLIENT_ID` |
| Query key | `UPPER_SNAKE_CASE` + suffix `_QUERY_KEY` | `USER_LIST_QUERY_KEY` |
| Enum value | `UPPER_SNAKE_CASE` | `enum Status { ACTIVE }` |

### 5.2 Hàm

| Loại | Convention | Ví dụ |
|---|---|---|
| Hàm thường | `camelCase`, động từ | `getUserList`, `handleSubmit` |
| Hàm private/protected | `camelCase` | `addBearerAuthorizationHeader` |
| Fetcher thuần (cho hook) | `getXxx` / `fetchXxx` | `getUser`, `getUserList` |
| API class method | `getXxx`, `createXxx`, `updateXxx`, `deleteXxx` | `getUsers`, `createUser` |
| Event handler | `handleXxx` / `onXxx` | `handleSubmit`, `onClick` |
| Boolean function | prefix `is` / `has` / `can` / `should` | `isProtectedResource` |

### 5.3 Class & Instance

| Loại | Convention | Ví dụ |
|---|---|---|
| Class API | `PascalCase` + hậu tố `API` | `UserAPI`, `AuthAPI` |
| Instance API export | `camelCase` + hậu tố `Api` (singleton) | `userApi`, `authApi` |
| Abstract class | `PascalCase` + prefix `Abstract` | `AbstractRestApiClient` |
| Exception class | `PascalCase` + hậu tố `Exception` | `ApiConnectionException` |

```ts
class UserAPI extends AbstractRestApiClient {
  protected protectedResource = true
  public getUsers(query?: UrlQueryType, cache = true): Promise<...> { ... }
}

export const userApi = new UserAPI()  // singleton
```

### 5.4 Type & Interface

Dự án phân biệt rõ **4 loại type**:

| Loại | Hậu tố | Ví dụ |
|---|---|---|
| Entity (response từ server) | `Props` | `UserProps`, `RoleProps`, `AuditLog` |
| Form input (gửi lên server) | `FormProps` / `DTO` | `UserModificationFormProps`, `LoginCredentialsDTO` |
| Request filter | `Request` | `AuditLogRequest`, `UrlQueryType` |
| Response wrapper | `Response` | `AuthResponse`, `VerifyEmailResponse` |
| Option cho hook | `Options` | `UseUserListOptions` |
| Query key type | `QueryKey` | `UserListQueryKey` |

```ts
// Entity — dữ liệu server trả về
export type UserProps = {
  username: string
  email: string
  is_active: boolean
} & BaseEntity

// Form props — dữ liệu gửi lên (Omit field server-only)
export type UserModificationFormProps = Omit<UserProps, 'is_staff' | 'is_superuser'>

// DTO — data transfer object
export type LoginCredentialsDTO = { email: string; password: string }

// Request
export type AuditLogRequest = { page?: number; page_size?: number; search?: string }

// Response
export type AuthResponse = { access: string; refresh: string; user: AuthUser }
```

---

## 6. Hook factory pattern

Mỗi hook export đúng **5 thứ** theo thứ tự:

```ts
// 1. Query key constant
export const USER_LIST_QUERY_KEY = 'users'

// 2. Query key type
type UserListQueryKey = [typeof USER_LIST_QUERY_KEY, UrlQueryType | undefined]

// 3. Fetcher thuần (dùng được ngoài React)
export const getUserList = (query?: UrlQueryType): Promise<APIResultPagination<UserProps>> => {
  return userApi.getUsers(query)
}

// 4. Options interface
export interface UseUserListOptions {
  config?: QueryConfig<typeof getUserList>
  query?: UrlQueryType
}

// 5. Hook
export const useUserList = ({ config, query }: UseUserListOptions = {}) => {
  return useQuery<APIResultPagination<UserProps>, unknown, APIResultPagination<UserProps>, UserListQueryKey>({
    queryKey: [USER_LIST_QUERY_KEY, query],
    queryFn: () => getUserList(query),
    ...config,
  } as UseQueryOptions<APIResultPagination<UserProps>, unknown, APIResultPagination<UserProps>, UserListQueryKey>)
}
```

> Lợi ích: fetcher thuần → dễ test, gọi ở server-side, prefetch, batch.

---

## 7. Quy tắc đặt tên API METHOD

Trong class API (extend `AbstractRestApiClient`), đặt tên theo **chuẩn REST**:

| HTTP | Tên method | Ví dụ |
|---|---|---|
| GET (list) | `getXxx` (số nhiều) | `getUsers`, `getRoles` |
| GET (detail) | `getXxx` (số ít) | `getUser`, `getRole` |
| POST (create) | `createXxx` | `createUser`, `createRole` |
| POST (action) | `verbXxx` / `xxxAction` | `resendVerificationEmail`, `changePassword` |
| PATCH (update) | `updateXxx` | `updateUser`, `updateRole` |
| DELETE | `deleteXxx` | `deleteUser`, `deleteRole` |
| POST (auth) | `xxxWith...` | `loginWithEmailAndPassword` |

```ts
class UserAPI extends AbstractRestApiClient {
  protected protectedResource = true

  public getUsers(query?: UrlQueryType, cache = true): Promise<...> { ... }
  public getUser(userId: string, cache = true): Promise<UserProps> { ... }
  public createUser(data: UserModificationFormProps): Promise<UserProps> { ... }
  public updateUser(userId: string, data: UserModificationFormProps): Promise<UserProps> { ... }
  public deleteUser(userId: string): Promise<any> { ... }
  public changePassword(data: ChangePasswordFormProps): Promise<any> { ... }
}
```

---

## 8. Barrel export rules

**Index file chỉ export types**, không export components/hooks (tránh bundle lớn, dễ tree-shaking):

```ts
// features/users/index.ts — chỉ export types
export * from './types'

// features/users/hooks/user/index.ts — export hooks
export * from './useUser'
export * from './useUserList'
export * from './useUserDelete'
```

---

## 9. Layered Architecture — Dependency Direction

```
app/ (routes)  →  features/<x>/views/  →  features/<x>/components/
                ↓                            ↓
                features/<x>/hooks/  →  features/<x>/api/  →  core/api/client/
                                            ↓
                                            @workspace/api (BaseRestAPIClient, types)
                                            @workspace/types (Zod schemas, DTOs)
```

**Nguyên tắc**:
- `app/` chỉ import từ `features/<x>/views/` (qua barrel)
- `views/` import `components/`, `hooks/`, `lib/`
- `components/` chỉ nhận props, gọi `hooks/`
- `hooks/` gọi `api/`
- `api/` extend `core/api/client/AbstractRestApiClient`
- Feature **không import feature khác** trực tiếp trừ khi qua barrel `index.ts` và chỉ lấy **types**
- Shared code đặt vào `packages/*` (ui, hooks, utils, types, api)

---

## 10. Template tạo feature mới

Khi tạo feature mới (vd: `orders`):

```
features/orders/
├── api/
│   └── index.ts                       ← class OrdersAPI extends AbstractRestApiClient
├── hooks/
│   ├── useOrders.ts
│   ├── useOrderList.ts
│   ├── useOrderCreate.ts
│   ├── useOrderUpdate.ts
│   ├── useOrderDelete.ts
│   └── index.ts                       ← barrel
├── components/
│   └── order/
│       ├── OrderListComponent.tsx
│       └── DeleteOrderModal.tsx
├── views/
│   └── order/
│       ├── OrdersList.tsx
│       └── OrderForm.tsx
├── types/
│   ├── order.ts
│   └── index.ts
├── locales/
│   ├── en.json
│   └── vi.json
└── index.ts                           ← chỉ export types
```

Và mount route trong `app/admin/orders/route.ts` + `app/admin/orders/page.tsx`:

```tsx
// app/admin/orders/page.tsx
import { OrdersList } from '@/features/orders/views/order/OrdersList'
export default OrdersList
```

---

## 11. Checklist khi review code

- [ ] Folder feature theo `kebab-case`, số ít
- [ ] Layer folder luôn số ít (`api/`, `hooks/`, `types/`, `components/`, `views/`)
- [ ] Component file `PascalCase.tsx`
- [ ] Hook file `camelCase.ts` prefix `use`
- [ ] Barrel `index.ts` chỉ export types
- [ ] Class API: `PascalCase` + `API`; instance: `camelCase` + `Api`
- [ ] Entity type: hậu tố `Props`; Form: `FormProps`/`DTO`; Request: `Request`; Response: `Response`
- [ ] Query key: `UPPER_SNAKE_CASE` + `_QUERY_KEY`
- [ ] Hook factory: export query key, fetcher thuần, options interface, hook
- [ ] API method theo chuẩn REST (`get/create/update/delete`)
- [ ] Boolean prefix `is`/`has`/`can`/`should`
- [ ] Import order: built-in → external → `@workspace/*` → relative
