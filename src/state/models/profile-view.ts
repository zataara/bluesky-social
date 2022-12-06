import {makeAutoObservable, runInAction} from 'mobx'
import * as GetProfile from '../../third-party/api/src/client/types/app/bsky/actor/getProfile'
import * as Profile from '../../third-party/api/src/client/types/app/bsky/actor/profile'
import {Entity} from '../../third-party/api/src/client/types/app/bsky/feed/post'
import {extractEntities} from '../../lib/strings'
import {Declaration} from './_common'
import {RootStoreModel} from './root-store'
import * as apilib from '../lib/api'
import {Image} from 'react-native-image-crop-picker'

export const ACTOR_TYPE_USER = 'app.bsky.system.actorUser'
export const ACTOR_TYPE_SCENE = 'app.bsky.system.actorScene'

export class ProfileViewMyStateModel {
  follow?: string
  member?: string

  constructor() {
    makeAutoObservable(this)
  }
}

export class ProfileViewModel {
  // state
  isLoading = false
  isRefreshing = false
  hasLoaded = false
  error = ''
  params: GetProfile.QueryParams

  // data
  did: string = ''
  handle: string = ''
  declaration: Declaration = {
    cid: '',
    actorType: '',
  }
  creator: string = ''
  displayName?: string
  description?: string
  followersCount: number = 0
  followsCount: number = 0
  membersCount: number = 0
  postsCount: number = 0
  myState = new ProfileViewMyStateModel()

  // added data
  descriptionEntities?: Entity[]

  // temp state while imagery is not supported by the protocol
  userAvatar: Image | null = null
  userBanner: Image | null = null

  constructor(
    public rootStore: RootStoreModel,
    params: GetProfile.QueryParams,
  ) {
    makeAutoObservable(
      this,
      {
        rootStore: false,
        params: false,
      },
      {autoBind: true},
    )
    this.params = params
  }

  get hasContent() {
    return this.did !== ''
  }

  get hasError() {
    return this.error !== ''
  }

  get isEmpty() {
    return this.hasLoaded && !this.hasContent
  }

  get isUser() {
    return this.declaration.actorType === ACTOR_TYPE_USER
  }

  get isScene() {
    return this.declaration.actorType === ACTOR_TYPE_SCENE
  }

  // public api
  // =

  async setup() {
    await this._load()
  }

  async refresh() {
    await this._load(true)
  }

  async toggleFollowing() {
    if (!this.rootStore.me.did) {
      throw new Error('Not logged in')
    }
    if (this.myState.follow) {
      await apilib.unfollow(this.rootStore, this.myState.follow)
      runInAction(() => {
        this.followersCount--
        this.myState.follow = undefined
      })
    } else {
      const res = await apilib.follow(
        this.rootStore,
        this.did,
        this.declaration.cid,
      )
      runInAction(() => {
        this.followersCount++
        this.myState.follow = res.uri
      })
    }
  }

  async updateProfile(fn: (existing?: Profile.Record) => Profile.Record) {
    await apilib.updateProfile(this.rootStore, this.did, fn)
    await this.refresh()
  }

  // state transitions
  // =

  updateUserAvatar(img: Image) {
    this.userAvatar = img
  }

  updateUserBanner(img: Image) {
    this.userBanner = img
  }

  private _xLoading(isRefreshing = false) {
    this.isLoading = true
    this.isRefreshing = isRefreshing
    this.error = ''
  }

  private _xIdle(err: string = '') {
    this.isLoading = false
    this.isRefreshing = false
    this.hasLoaded = true
    this.error = err
  }

  // loader functions
  // =

  private async _load(isRefreshing = false) {
    this._xLoading(isRefreshing)
    try {
      const res = await this.rootStore.api.app.bsky.actor.getProfile(
        this.params,
      )
      this.rootStore.profiles.overwrite(this.params.actor, res) // cache invalidation
      this._replaceAll(res)
      this._xIdle()
    } catch (e: any) {
      this._xIdle(e.toString())
    }
  }

  private _replaceAll(res: GetProfile.Response) {
    console.log(res.data)
    this.did = res.data.did
    this.handle = res.data.handle
    Object.assign(this.declaration, res.data.declaration)
    this.creator = res.data.creator
    this.displayName = res.data.displayName
    this.description = res.data.description
    this.followersCount = res.data.followersCount
    this.followsCount = res.data.followsCount
    this.membersCount = res.data.membersCount
    this.postsCount = res.data.postsCount
    if (res.data.myState) {
      Object.assign(this.myState, res.data.myState)
    }
    this.descriptionEntities = extractEntities(this.description || '')
  }
}
