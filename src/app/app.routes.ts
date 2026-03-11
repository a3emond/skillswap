import { Routes } from '@angular/router'

import { authGuard } from './core/guards/auth.guard'

import { Login } from './features/auth/login/login'
import { Register } from './features/auth/register/register'

import { ProfileMe } from './features/users/profile-me/profile-me'
import { PublicProfile } from './features/users/public-profile/public-profile'

import { JobSearch } from './features/jobs/job-search/job-search'
import { JobCreate } from './features/jobs/job-create/job-create'
import { JobDetails } from './features/jobs/job-details/job-details'
import { JobEdit } from './features/jobs/job-edit/job-edit'
import { MyPostings } from './features/jobs/my-postings/my-postings'

import { JobProposals } from './features/proposals/job-proposals/job-proposals'
import { MyBids } from './features/proposals/my-bids/my-bids'

import { UserReviews } from './features/reviews/user-reviews/user-reviews'

import { Stats } from './features/platform/stats/stats'


export const routes: Routes = [

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'jobs'
  },

  {
    path: 'login',
    component: Login
  },

  {
    path: 'register',
    component: Register
  },

  {
    path: 'jobs',
    component: JobSearch
  },

  {
    path: 'jobs/create',
    component: JobCreate,
    canActivate: [authGuard]
  },

  {
    path: 'jobs/my-postings',
    component: MyPostings,
    canActivate: [authGuard]
  },

  {
    path: 'jobs/:id',
    component: JobDetails,
    canActivate: [authGuard]
  },

  {
    path: 'jobs/:id/edit',
    component: JobEdit,
    canActivate: [authGuard]
  },

  {
    path: 'jobs/:id/proposals',
    component: JobProposals,
    canActivate: [authGuard]
  },

  {
    path: 'proposals/my-bids',
    component: MyBids,
    canActivate: [authGuard]
  },

  {
    path: 'users/me',
    component: ProfileMe,
    canActivate: [authGuard]
  },

  {
    path: 'users/:username',
    component: PublicProfile
  },

  {
    path: 'reviews/user/:id',
    component: UserReviews
  },

  {
    path: 'platform/stats',
    component: Stats
  },

  {
    path: '**',
    redirectTo: 'jobs'
  }

]