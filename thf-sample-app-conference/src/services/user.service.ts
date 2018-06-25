import { Injectable } from '@angular/core';

import { ThfEntity } from '@totvs/thf-sync/models';
import { ThfStorageService } from '@totvs/thf-storage';
import { ThfSyncService, ThfHttpRequestData, ThfHttpRequestType } from '@totvs/thf-sync';

@Injectable()
export class UserService {

  userModel: ThfEntity;

  constructor(private thfSync: ThfSyncService, private thfStorage: ThfStorageService) {
    this.userModel = this.thfSync.getModel('Users');
  }

  async addFavoriteLecture(lectureId) {
    const loggedUser = await this.getLoggedUser();
    const user = await this.userModel.findById(loggedUser).exec();
    user.favoriteLectures = user.favoriteLectures || [];

    if (!user.favoriteLectures.includes(lectureId)) {
      user.favoriteLectures.push(lectureId);

      await this.userModel.save(user);

    } else {
      throw new Error();
    }

  }

  createUser(user) {
    const requestData: ThfHttpRequestData = {
      url: 'http://localhost:8080/conference-api/api/v1/users/',
      method: ThfHttpRequestType.POST,
      body: user
    };

    this.thfSync.insertHttpCommand(requestData, user.username);
  }

  async getFavoriteLectures() {
    const loggedUser = await this.getLoggedUser();
    const user = await this.userModel.findById(loggedUser).exec();
    return 'favoriteLectures' in user ? user.favoriteLectures : undefined;
  }

  async getLoggedUser() {
    const login = await this.thfStorage.get('login');
    return login ? login.userId : undefined;
  }

  getModel() {
    return this.userModel;
  }

  async getUsers() {
    const userData = await this.userModel.find().exec();
    return userData.items;
  }

  async onLogin(username, password) {
    const users = await this.getUsers();

    const foundUser = users.find(user => {
      return (user.username === username) && (user.password === password);
    });

    return foundUser ? this.logIn(foundUser) : Promise.reject('User not found');
  }

  async removeFavoriteLecture(lectureId) {
    const loggedUser = await this.getLoggedUser();
    const user = await this.userModel.findById(loggedUser).exec();

    user.favoriteLectures = user.favoriteLectures.filter(id => lectureId !== id);
    await this.userModel.save(user);

  }

  synchronize() {
    return this.thfSync.sync();
  }

  private logIn(foundUser) {
    return this.thfStorage.set('login', { userId: foundUser.id });
  }

}