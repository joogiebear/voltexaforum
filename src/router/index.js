import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ThreadListView from '../views/ThreadListView.vue'
import ThreadView from '../views/ThreadView.vue'
import StoreView from '../views/StoreView.vue'
import ProfileView from '../views/ProfileView.vue'
import AchievementsView from '../views/AchievementsView.vue'
import CreditsView from '../views/CreditsView.vue'
import UserCPView from '../views/UserCPView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import NewThreadView from '../views/NewThreadView.vue'
import SearchView from '../views/SearchView.vue'
import NotificationsView from '../views/NotificationsView.vue'
import MessagesView from '../views/MessagesView.vue'
import { useAuthStore } from '../stores/auth'
import { useForumStore } from '../stores/forum'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/maintenance', name: 'Maintenance', component: () => import('../views/MaintenanceView.vue') },
  { path: '/forum/:slug', name: 'Forum', component: ThreadListView },
  { path: '/thread/:id', name: 'Thread', component: ThreadView },
  { path: '/store', name: 'Store', component: StoreView },
  { path: '/store/success', name: 'StorePurchaseSuccess', component: () => import('../views/StorePurchaseSuccess.vue') },
  { path: '/store/cancel', name: 'StorePurchaseCancel', component: () => import('../views/StorePurchaseCancel.vue') },
  { path: '/profile/:username', name: 'Profile', component: ProfileView },
  { path: '/achievements', name: 'Achievements', component: AchievementsView },
  { path: '/credits', name: 'Credits', component: CreditsView, meta: { requiresAuth: true } },
  { path: '/usercp', name: 'UserCP', component: UserCPView, meta: { requiresAuth: true } },
  { path: '/notifications', name: 'Notifications', component: NotificationsView, meta: { requiresAuth: true } },
  { path: '/messages', name: 'Messages', component: MessagesView, meta: { requiresAuth: true } },
  { path: '/messages/:id', name: 'Conversation', component: MessagesView, meta: { requiresAuth: true } },
  { path: '/members', name: 'Members', component: () => import('../views/MembersView.vue') },
  { path: '/upgrade', name: 'Upgrade', component: () => import('../views/UpgradeView.vue') },
  { path: '/staff', name: 'Staff', component: () => import('../views/StaffView.vue') },
  { path: '/search', name: 'Search', component: SearchView },
  { path: '/forum/:slug/new-thread', name: 'NewThread', component: NewThreadView, meta: { requiresAuth: true } },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/register', name: 'Register', component: RegisterView },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPasswordView },
  { path: '/reset-password', name: 'ResetPassword', component: ResetPasswordView },
  { path: '/verify-email', name: 'VerifyEmail', component: () => import('../views/EmailVerifyView.vue') },

  // Admin routes — lazy loaded
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', redirect: '/admin/dashboard' },
      { path: 'dashboard', name: 'AdminDashboard', component: () => import('../views/admin/AdminDashboard.vue'), meta: { title: 'Dashboard' } },
      // Community
      { path: 'users', name: 'AdminUsers', component: () => import('../views/admin/AdminUsers.vue'), meta: { title: 'Users' } },
      { path: 'users/:id', name: 'AdminUserEdit', component: () => import('../views/admin/AdminUserEdit.vue'), meta: { title: 'Edit User' } },
      { path: 'groups', name: 'AdminGroups', component: () => import('../views/admin/AdminGroups.vue'), meta: { title: 'Groups & Roles' } },
      { path: 'moderation', name: 'AdminModeration', component: () => import('../views/admin/AdminModeration.vue'), meta: { title: 'Moderation' } },
      // Content
      { path: 'content/threads', name: 'AdminContentThreads', component: () => import('../views/admin/content/AdminContentThreads.vue'), meta: { title: 'Threads' } },
      { path: 'content/posts', name: 'AdminContentPosts', component: () => import('../views/admin/content/AdminContentPosts.vue'), meta: { title: 'Posts' } },
      // Commerce
      { path: 'upgrades', name: 'AdminUpgrades', component: () => import('../views/admin/AdminUpgrades.vue'), meta: { title: 'Upgrade Plans' } },
      { path: 'store', redirect: '/admin/store/items' },
      { path: 'store/items', name: 'AdminStoreItems', component: () => import('../views/admin/AdminStoreItems.vue'), meta: { title: 'Store Items' } },
      { path: 'store/purchases', name: 'AdminStorePurchases', component: () => import('../views/admin/AdminStorePurchases.vue'), meta: { title: 'Purchases' } },
      // Advertisements
      { path: 'advertisements', name: 'AdminAdvertisements', component: () => import('../views/admin/AdminAdvertisements.vue'), meta: { title: 'Advertisements' } },
      // Gamification
      { path: 'achievements', name: 'AdminAchievements', component: () => import('../views/admin/AdminAchievements.vue'), meta: { title: 'Achievements' } },
      { path: 'awards', name: 'AdminAwards', component: () => import('../views/admin/AdminAwards.vue'), meta: { title: 'Awards' } },
      // Appearance
      { path: 'appearance/themes', name: 'AdminAppearanceThemes', component: () => import('../views/admin/appearance/AdminAppearanceThemes.vue'), meta: { title: 'Themes' } },
      { path: 'appearance/custom-code', name: 'AdminAppearanceCustomCode', component: () => import('../views/admin/appearance/AdminAppearanceCustomCode.vue'), meta: { title: 'Custom CSS/JS' } },
      // Plugins
      { path: 'plugins', name: 'AdminPlugins', component: () => import('../views/admin/AdminPlugins.vue'), meta: { title: 'Plugins' } },
      { path: 'plugins/announcements', name: 'AdminAnnouncementsPlugin', component: () => import('../views/admin/plugins/AdminAnnouncementsPlugin.vue'), meta: { title: 'Announcements Plugin' } },
      // Settings
      { path: 'settings', redirect: '/admin/settings/general' },
      { path: 'settings/general', name: 'AdminSettingsGeneral', component: () => import('../views/admin/settings/AdminSettingsGeneral.vue'), meta: { title: 'General Settings' } },
      { path: 'settings/forums', redirect: '/admin/forums' },
      { path: 'settings/email', name: 'AdminSettingsEmail', component: () => import('../views/admin/settings/AdminSettingsEmail.vue'), meta: { title: 'Email & SMTP' } },
      { path: 'settings/credits', name: 'AdminSettingsCredits', component: () => import('../views/admin/settings/AdminSettingsCredits.vue'), meta: { title: 'Credits' } },
      { path: 'settings/store', name: 'AdminSettingsStore', component: () => import('../views/admin/settings/AdminSettingsStore.vue'), meta: { title: 'Store Settings' } },
      // Old config route redirect
      { path: 'config', redirect: '/admin/settings/general' },
      // Forums (kept for redirect target and direct access)
      { path: 'forums', name: 'AdminForums', component: () => import('../views/admin/AdminForums.vue'), meta: { title: 'Forums' } },
      { path: 'forums/create', name: 'AdminForumCreate', component: () => import('../views/admin/AdminForums.vue'), meta: { title: 'Create Forum' } },
      { path: 'forums/:id/permissions', name: 'AdminForumPermissions', component: () => import('../views/admin/AdminForumPermissions.vue'), meta: { title: 'Forum Permissions' } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const forumStore = useForumStore()

  // Maintenance mode — redirect non-admins to /maintenance
  if (forumStore.isMaintenanceMode && !authStore.isAdmin && to.path !== '/maintenance') {
    return '/maintenance'
  }

  if (to.meta.requiresAuth && !authStore.token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin || to.path.startsWith('/admin')) {
    // If we have a token but haven't finished initializing, let it through —
    // fetchUser is still in flight or had a transient error. The page will
    // handle unauthorized state once the user loads.
    if (!authStore.token) return '/'
    if (authStore.initialized && !authStore.isAdmin) return '/'
  }

  // Redirect logged-in users away from guest-only pages
  if (['Login', 'Register', 'ForgotPassword', 'ResetPassword'].includes(to.name) && authStore.isLoggedIn) {
    return '/'
  }
})

router.afterEach((to) => {
  const forumStore = useForumStore()
  const forumName = forumStore.config?.forum_name || 'My Forum'
  const pageTitle = to.meta?.title || to.name || ''
  document.title = pageTitle ? `${forumName} - ${pageTitle}` : forumName
})

export default router
