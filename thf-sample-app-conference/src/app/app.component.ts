import { Component, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { Events, MenuController, Nav, Platform } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { ThfNetworkType, ThfSyncConfig, ThfSyncService } from '@totvs/thf-sync';
import { ThfStorageService } from '@totvs/thf-storage';

import { AboutPage } from '../pages/about/about';
import { LoginPage } from './../pages/login/login';
import { NotesPage } from './../pages/notes/notes.component';
import { SchedulePage } from './../pages/schedule/schedule';
import { schemas } from './../schemas/schemas-list';
import { SignupPage } from './../pages/signup/signup';
import { SpeakerListPage } from './../pages/speaker-list/speaker-list';
import { TabsPage } from '../pages/tabs/tabs';

export interface PageInterface {
  title: string;
  name: string;
  component: any;
  icon: string;
  logsOut?: boolean;
  index?: number;
  tabName?: string;
  tabComponent?: any;
}

@Component({
  templateUrl: 'app.html'
})
export class MyApp {

  logoutPage = { title: 'Logout', name: 'TabsPage', component: TabsPage, icon: 'log-out' };
  notePage = { title: 'Notes', name: 'NotesPage', component: NotesPage, icon: 'paper' };
  rootPage;

  @ViewChild(Nav) nav: Nav;

  appPages: Array<PageInterface> = [
    { title: 'Schedule', name: 'TabsPage', component: TabsPage, tabComponent: SchedulePage, index: 0, icon: 'calendar' },
    { title: 'Speakers', name: 'TabsPage', component: TabsPage, tabComponent: SpeakerListPage, index: 1, icon: 'contacts' },
    { title: 'About conference', name: 'TabsPage', component: TabsPage, tabComponent: AboutPage, index: 2, icon: 'information-circle' }
  ];

  loggedOutPages: Array<PageInterface> = [
    { title: 'Login', name: 'LoginPage', component: LoginPage, icon: 'log-in' },
    { title: 'Signup', name: 'SignupPage', component: SignupPage, icon: 'person-add' }
  ];

  constructor(
    public platform: Platform,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    public events: Events,
    private thfSync: ThfSyncService,
    private thfStorage: ThfStorageService,
    private menu: MenuController) {

    this.initApp();
    this.getResponses();
  }

  isActive(page: PageInterface) {
    const childNav = this.nav.getActiveChildNavs()[0];

    if (childNav) {
      if (childNav.getSelected() && childNav.getSelected().root === page.tabComponent) {
        return 'primary';
      }
      return;
    }

    if (this.nav.getActive() && this.nav.getActive().name === page.name) {
      return 'primary';
    }
    return;
  }

  logOut() {
    this.thfStorage.remove('login').then(() => this.events.publish('user:logout'));
  }

  openPage(page: PageInterface) {
    let params = {};

    if (page.index) { params = { tabIndex: page.index }; }

    if (this.nav.getActiveChildNavs().length && page.index) {
      this.nav.getActiveChildNavs()[0].select(page.index);
    } else {
      this.nav.setRoot(page.component, params).catch((err: any) => {
        console.error(`Didn't set nav root: ${err}`);
      });
    }

  }

  private async checkDataInitial() {
    const firstLoad = await this.thfStorage.get('firstLoad');

    if (!firstLoad) {
      this.loadDataInitial();
    } else {
      this.splashScreen.hide();
      this.rootPage = TabsPage;
    }
  }

  private enableMenu(login: boolean) {
    this.menu.enable(!login, 'loggedOutMenu');
    this.menu.enable(login, 'loggedInMenu');
  }

  private async loadDataInitial() {
    await this.thfStorage.set('firstLoad', true);

    this.thfSync.loadData().subscribe(() => {
      this.splashScreen.hide();
      this.rootPage = TabsPage;
    });

  }

  private initApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();

      this.listenToLoginEvents();
      this.isLogged();
      this.initSync();

    });
  }

  private initSync() {
    const config: ThfSyncConfig = {
      type: ThfNetworkType.ethernet,
      period: 10
    };

    return this.thfSync.prepare(schemas, config).then(() => this.checkDataInitial());
  }

  private isLogged() {
    this.thfStorage.get('login').then(login => this.enableMenu(!!login));
  }

  private getResponses() {
    this.thfSync.getHttpResponses().subscribe(thfHttpClientResponse => {

      if (thfHttpClientResponse.response instanceof HttpErrorResponse) {
        this.thfSync.removeItemOfSync(thfHttpClientResponse.id).then(() => {
          this.thfSync.resumeSync();
        });
      }

    });
  }

  private listenToLoginEvents() {
    this.events.subscribe('user:login', () => {
      this.enableMenu(true);
      this.nav.setRoot(TabsPage);
    });

    this.events.subscribe('user:signup', () => {
      this.enableMenu(true);
      this.nav.setRoot(TabsPage);
    });

    this.events.subscribe('user:logout', () => {
      this.enableMenu(false);
      this.nav.setRoot(TabsPage);
    });
  }

}
