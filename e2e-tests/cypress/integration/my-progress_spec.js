/*
 * Copyright 2020 SkillTree
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import moment from 'moment';
import dayjs from 'dayjs';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTimePlugin);

const dateFormatter = value => moment.utc(value).format('YYYY-MM-DD[T]HH:mm:ss[Z]');
const timeFromNowFormatter = (value) => dayjs(value).startOf('seconds').fromNow();

const testTime = new Date().getTime()
const yesterday = new Date().getTime() - (1000 * 60 * 60 * 24)

describe('Navigation Tests', () => {
  // const snapshotOptions = {
  //   blackout: ['[data-cy=pointHistoryChart]', '[data-cy=timePassed]'],
  //   failureThreshold: 0.03, // threshold for entire image
  //   failureThresholdType: 'percent', // percent of image or number of pixels
  //   customDiffConfig: { threshold: 0.01 }, // threshold for each pixel
  //   capture: 'fullPage', // When fullPage, the application under test is captured in its entirety from top to bottom.
  // };

  beforeEach(() => {
    cy.log(`--------> ${testTime}`);
    cy.intercept('/api/metrics/allProjectsSkillEventsOverTimeMetricsBuilder**').as('allSkillEventsForUser');

    cy.createProject(1);
    cy.enableProdMode(1);

    cy.createSubject(1, 1);
    cy.createSubject(1, 2);
    cy.createSubject(1, 3);

    cy.createSkill(1, 1, 1);
    cy.createSkill(1, 1, 2);
    cy.createSkill(1, 1, 3);
    cy.createSkill(1, 1, 4);
    cy.request('POST', `/admin/projects/proj1/skills/skill4/dependency/skill2`)


    cy.request('POST', `/api/projects/proj1/skills/skill1`, {
      userId: Cypress.env('proxyUser'),
      timestamp: yesterday
    })
    cy.request('POST', `/api/projects/proj1/skills/skill1`, {
      userId: Cypress.env('proxyUser'),
      timestamp: testTime
    })


    cy.request('POST', `/api/projects/proj1/skills/skill3`, {
      userId: Cypress.env('proxyUser'),
      timestamp: yesterday
    })
    cy.request('POST', `/api/projects/proj1/skills/skill3`, {
      userId: Cypress.env('proxyUser'),
      timestamp: testTime
    })


    cy.request('POST', '/admin/projects/proj1/badges/badge1', {
      projectId: 'proj1',
      badgeId: 'badge1',
      name: 'Badge 1'
    });

    cy.request('POST', '/admin/projects/proj1/badges/gemBadge', {
      projectId: 'proj1',
      badgeId: 'gemBadge',
      name: 'Gem Badge',
      startDate: dateFormatter(new Date() - 1000 * 60 * 60 * 24 * 7),
      endDate: dateFormatter(new Date() + 1000 * 60 * 60 * 24 * 5),
    });


    cy.createProject(2);
    cy.enableProdMode(2);
    cy.createSubject(2, 1);
    cy.createSubject(2, 2);
    cy.createSubject(2, 3);

    cy.createSkill(2, 1, 1);
    cy.createSkill(2, 1, 2);
    cy.createSkill(2, 1, 3);
    cy.createSkill(2, 1, 4);
    cy.createSkill(2, 1, 5);
    cy.createSkill(2, 1, 6);

    cy.loginAsRootUser();
    cy.request('POST', '/admin/projects/Inception/settings/production.mode.enabled', {
      projectId: 'Inception',
      setting: 'production.mode.enabled',
      value: 'true'
    });

    cy.fixture('vars.json').then((vars) => {
      cy.request('POST', '/logout');
      cy.register(Cypress.env('proxyUser'), vars.defaultPass, false);
      cy.loginAsProxyUser()
    });
    cy.loginAsProxyUser()

    cy.addToMyProjects(1);
    cy.addToMyProjects(2);
  });

  it('visit My Progress page', function () {
    cy.visit('/');

    cy.get('[data-cy="breadcrumb-Progress And Rankings"]').contains('Progress And Rankings').should('be.visible');

    cy.get('[data-cy=numProjectsContributed]').contains(new RegExp(/^1$/));
    cy.get('[data-cy=numProjectsAvailable]').contains(new RegExp(/^\/ 2$/));
    cy.get('[data-cy=info-snap-footer]').contains('You still have 1 project to explore.');

    cy.get('[data-cy=numAchievedSkills]').contains(new RegExp(/^2$/));
    cy.get('[data-cy=numSkillsAvailable]').contains(new RegExp(/^Total: 10$/));
    cy.get('[data-cy=num-skills-footer]').contains('So many skills... so little time! Good luck!');

    // cy.get('[data-cy=mostRecentAchievedSkill]').contains(new RegExp(/^Last Achieved skill \d+ minute[s]? ago$/));
    cy.get('[data-cy=mostRecentAchievedSkill]').contains(`Last Achieved skill ${timeFromNowFormatter(testTime)}`);
    cy.get('[data-cy=numAchievedSkillsLastWeek]').contains('2 skills in the last week');
    cy.get('[data-cy=numAchievedSkillsLastMonth]').contains('2 skills in the last month');
    cy.get('[data-cy=last-earned-footer]').contains('Keep up the good work!!');

    cy.get('[data-cy=badges-num-footer]').contains('Be proud to earn those badges!!');
    cy.get('[data-cy=numAchievedBadges]').contains(new RegExp(/^0$/));
    cy.get('[data-cy=numBadgesAvailable]').contains(new RegExp(/^\/ 2$/));
    cy.get('[data-cy=numAchievedGlobalBadges]').should('not.exist')
    cy.get('[data-cy=numAchievedGemBadges]').contains('Gems: 0');

    cy.get('[data-cy=project-link-proj2]').should('be.visible');
    cy.get('[data-cy=project-link-proj2]').find('[data-cy=project-card-project-name]').contains('This is project 2');

    cy.get('[data-cy=project-link-proj1]').should('be.visible');
    cy.get('[data-cy=project-link-proj1]').find('[data-cy=project-card-project-name]').contains('This is project 1');
    cy.get('[data-cy=project-link-proj1]').find('[data-cy=project-card-project-level]').contains('3');
    cy.get('[data-cy=project-link-proj1]').find('[data-cy=project-card-project-rank]').contains(new RegExp(/^Rank: 1 \/ 1$/));
    cy.get('[data-cy=project-link-proj1]').find('[data-cy=project-card-project-points]').contains(new RegExp(/^400 \/ 800$/));

    cy.get('[data-cy=inception-button]').should('not.exist');

    cy.get('[data-cy=project-link-proj1]').click()

    cy.dashboardCd().contains('Overall Points');
    cy.get('[data-cy="breadcrumb-Progress And Rankings"]').should('be.visible');
    cy.get('[data-cy=breadcrumb-proj1]').should('be.visible');
    cy.get('[data-cy=breadcrumb-projects]').should('not.exist');
  });


  it('badges card - gems and not global badges', function () {
    cy.visit('/');

    cy.get('[data-cy=numAchievedGlobalBadges]').should('not.exist')
    cy.get('[data-cy=numAchievedGemBadges]').contains('Gems: 0 / 1')
  })

  it('badges card - global badges and not gems', function () {
    cy.intercept({
      method: 'GET',
      path: '/api/myProgressSummary',
    }, {
      statusCode: 200,
      body: {"projectSummaries":[{"projectId":"Inception","projectName":"Inception","points":0,"totalPoints":2695,"level":0,"totalUsers":1,"rank":1},{"projectId":"proj1","projectName":"Project 1","points":0,"totalPoints":1400,"level":0,"totalUsers":2,"rank":2}],"totalProjects":2,"numProjectsContributed":0,"totalSkills":56,"numAchievedSkills":0,"numAchievedSkillsLastMonth":0,"numAchievedSkillsLastWeek":0,"mostRecentAchievedSkill":null,"totalBadges":2,"gemCount":0,"globalBadgeCount":2,"numAchievedBadges":0,"numAchievedGemBadges":0,"numAchievedGlobalBadges":1}
    }).as('getMyProgress');

    cy.visit('/');
    cy.wait('@getMyProgress');

    cy.get('[data-cy=numAchievedGlobalBadges]').contains('Global Badges: 1 / 2')
    cy.get('[data-cy=numAchievedGemBadges]').should('not.exist')
  })


  it('badges card - global badges and gems', function () {
    cy.intercept({
      method: 'GET',
      path: '/api/myProgressSummary',
    }, {
      statusCode: 200,
      body: {"projectSummaries":[{"projectId":"Inception","projectName":"Inception","points":0,"totalPoints":2695,"level":0,"totalUsers":1,"rank":1},{"projectId":"proj1","projectName":"Project 1","points":0,"totalPoints":1400,"level":0,"totalUsers":2,"rank":2}],"totalProjects":2,"numProjectsContributed":0,"totalSkills":56,"numAchievedSkills":0,"numAchievedSkillsLastMonth":0,"numAchievedSkillsLastWeek":0,"mostRecentAchievedSkill":null,"totalBadges":2,"gemCount":5,"globalBadgeCount":2,"numAchievedBadges":0,"numAchievedGemBadges":2,"numAchievedGlobalBadges":1}
    }).as('getMyProgress');

    cy.visit('/');
    cy.wait('@getMyProgress');

    cy.get('[data-cy=numAchievedGlobalBadges]').contains('Global Badges: 1 / 2')
    cy.get('[data-cy=numAchievedGemBadges]').contains('Gems: 2 / 5')
  })

  it('badges card - no global badges and no gems', function () {
    cy.intercept({
      method: 'GET',
      path: '/api/myProgressSummary',
    }, {
      statusCode: 200,
      body: {"projectSummaries":[{"projectId":"Inception","projectName":"Inception","points":0,"totalPoints":2695,"level":0,"totalUsers":1,"rank":1},{"projectId":"proj1","projectName":"Project 1","points":0,"totalPoints":1400,"level":0,"totalUsers":2,"rank":2}],"totalProjects":2,"numProjectsContributed":0,"totalSkills":56,"numAchievedSkills":0,"numAchievedSkillsLastMonth":0,"numAchievedSkillsLastWeek":0,"mostRecentAchievedSkill":null,"totalBadges":2,"gemCount":0,"globalBadgeCount":0,"numAchievedBadges":0,"numAchievedGemBadges":0,"numAchievedGlobalBadges":0}
    }).as('getMyProgress');

    cy.visit('/');
    cy.wait('@getMyProgress');

    cy.get('[data-cy=numAchievedGlobalBadges]').should('not.exist')
    cy.get('[data-cy=numAchievedGemBadges]').should('not.exist')
  })

  it('My Progress page - contributed to all projects', function () {
    // // add a skill to Inception to have contributed to all projects
    cy.loginAsRootUser();
    cy.request('POST', `/api/projects/proj2/skills/skill1`, {
      userId: Cypress.env('proxyUser'),
      timestamp: new Date().getTime()
    })

    cy.loginAsProxyUser();
    cy.visit('/');

    cy.get('[data-cy=numProjectsContributed]').contains(new RegExp(/^2$/));
    cy.get('[data-cy=numProjectsAvailable]').contains(new RegExp(/^\/ 2$/));
    cy.get('[data-cy=info-snap-footer]').contains('Great job, you have contributed to all projects!');
  });

  it('My Progress page - not contributed to more than one project', function () {
    cy.createProject(3)
    cy.enableProdMode(3);
    cy.addToMyProjects(3);

    cy.loginAsProxyUser();
    cy.visit('/');

    cy.get('[data-cy=numProjectsContributed]').contains(new RegExp(/^1$/));
    cy.get('[data-cy=numProjectsAvailable]').contains(new RegExp(/^\/ 3$/));
    cy.get('[data-cy=info-snap-footer]').contains('You still have 2 projects to explore.');
  });


  it('mySkills page - projects that do not have "production mode" enabled are not included', function () {
    cy.createProject(3);
    cy.addToMyProjects(3)

    cy.createSubject(3, 1);
    cy.createSubject(3, 2);

    cy.createSkill(3, 1, 1);
    cy.createSkill(3, 1, 2);
    cy.createSkill(3, 1, 3);
    cy.createSkill(3, 1, 4);

    cy.createBadge(3, 1);

    cy.loginAsProxyUser();
    cy.visit('/');

    cy.get('[data-cy=numProjectsContributed]').contains(new RegExp(/^1$/));
    cy.get('[data-cy=numProjectsAvailable]').contains(new RegExp(/^\/ 2$/));
    cy.get('[data-cy=info-snap-footer]').contains('You still have 1 project to explore.');

    cy.get('[data-cy=numSkillsAvailable]').contains(new RegExp(/^Total: 10$/));
    cy.get('[data-cy=numBadgesAvailable]').contains(new RegExp(/^\/ 2$/));

    cy.get('[data-cy=project-link-proj1]').should('be.visible');
    cy.get('[data-cy=project-link-proj1]').find('[data-cy=project-card-project-name]').contains('This is project 1');

    cy.get('[data-cy=project-link-proj2]').should('be.visible');
    cy.get('[data-cy=project-link-proj2]').find('[data-cy=project-card-project-name]').contains('This is project 2');


    cy.get('[data-cy=project-link-proj3]').should('not.exist');
  });


  it('mySkills page - projects that are not added to My Projects are not included', function () {
    cy.createProject(3);
    cy.enableProdMode(3);

    cy.createSubject(3, 1);
    cy.createSubject(3, 2);

    cy.createSkill(3, 1, 1);
    cy.createSkill(3, 1, 2);
    cy.createSkill(3, 1, 3);
    cy.createSkill(3, 1, 4);

    cy.createBadge(3, 1);

    cy.loginAsProxyUser();
    cy.visit('/');

    cy.get('[data-cy=numProjectsContributed]').contains(new RegExp(/^1$/));
    cy.get('[data-cy=numProjectsAvailable]').contains(new RegExp(/^\/ 2$/));
    cy.get('[data-cy=info-snap-footer]').contains('You still have 1 project to explore.');

    cy.get('[data-cy=numSkillsAvailable]').contains(new RegExp(/^Total: 10$/));
    cy.get('[data-cy=numBadgesAvailable]').contains(new RegExp(/^\/ 2$/));

    cy.get('[data-cy=project-link-proj1]').should('be.visible');
    cy.get('[data-cy=project-link-proj1]').find('[data-cy=project-card-project-name]').contains('This is project 1');

    cy.get('[data-cy=project-link-proj2]').should('be.visible');
    cy.get('[data-cy=project-link-proj2]').find('[data-cy=project-card-project-name]').contains('This is project 2');


    cy.get('[data-cy=project-link-proj3]').should('not.exist');
  });

  it('no projects added to My Projects', function () {
    cy.removeFromMyProjects(1)
    cy.removeFromMyProjects(2)
    cy.visit('/progress-and-rankings');

    cy.contains('START CUSTOMIZING TODAY!')

    cy.get('[data-cy="manageMyProjsBtnInNoContent"]').click();
    cy.get('[data-cy="backToProgressAndRankingBtn"]');

    cy.visit('/progress-and-rankings');
    cy.get('[data-cy="manageMyProjsBtn"]').click();
    cy.get('[data-cy="backToProgressAndRankingBtn"]');
  });

  it('My Progress page - no projects with production mode enabled', function () {
    // remove production mode from all projects
    cy.loginAsRootUser();
    cy.request('POST', '/admin/projects/proj1/settings/production.mode.enabled', {
      projectId: 'proj1',
      setting: 'production.mode.enabled',
      value: 'false'
    });
    cy.request('POST', '/admin/projects/proj2/settings/production.mode.enabled', {
      projectId: 'proj2',
      setting: 'production.mode.enabled',
      value: 'false'
    });

    cy.loginAsProxyUser();
    cy.visit('/');


    cy.contains('START CUSTOMIZING TODAY!')
  });


  it('sort my projects', function () {
    cy.createProject(3);
    cy.enableProdMode(3);
    cy.addToMyProjects(3);

    cy.viewport(1200, 1000)

    cy.visit('/progress-and-rankings');

    const proj1Selector = '[data-cy=project-link-proj1] [data-cy="sortControlHandle"]';
    const proj2Selector = '[data-cy=project-link-proj2] [data-cy="sortControlHandle"]';
    const proj3Selector = '[data-cy=project-link-proj3] [data-cy="sortControlHandle"]';

    cy.intercept('/api/myprojects/proj1').as('updateMyProj1');
    cy.intercept('/api/myprojects/proj2').as('updateMyProj2');
    cy.intercept('/api/myprojects/proj3').as('updateMyProj3');

    cy.validateElementsOrder('[data-cy="project-card-project-name"]', ['This is project 3', 'This is project 2', 'This is project 1'])
    cy.get(proj2Selector).dragAndDrop(proj1Selector)
    cy.wait('@updateMyProj2')
    cy.validateElementsOrder('[data-cy="project-card-project-name"]', ['This is project 3', 'This is project 1', 'This is project 2'])

    // refresh and make sure that sort order is still the same
    cy.visit('/progress-and-rankings');
    cy.validateElementsOrder('[data-cy="project-card-project-name"]', ['This is project 3', 'This is project 1', 'This is project 2'])

    cy.get(proj3Selector).dragAndDrop(proj2Selector)
    cy.wait('@updateMyProj3')
    cy.validateElementsOrder('[data-cy="project-card-project-name"]', ['This is project 1', 'This is project 2', 'This is project 3'])

    cy.get(proj1Selector).dragAndDrop(proj2Selector)
    cy.wait('@updateMyProj1')
    cy.validateElementsOrder('[data-cy="project-card-project-name"]', ['This is project 2', 'This is project 1', 'This is project 3'])

    // navigate to My Projects and then return
    cy.get('[data-cy="manageMyProjsBtn"]').click();
    cy.get('[data-cy="backToProgressAndRankingBtn"]').click();
    cy.validateElementsOrder('[data-cy="project-card-project-name"]', ['This is project 2', 'This is project 1', 'This is project 3'])
  })

  it('cards on small and medium screen', function () {
    cy.viewport('iphone-6');
    cy.visit('/progress-and-rankings');
    cy.wait(2000);
    cy.matchSnapshotImageForElement('[data-cy="project-link-proj1"]', 'project-card-small-screen');

    cy.viewport('ipad-2');
    cy.visit('/progress-and-rankings');
    cy.wait(2000);
    cy.matchSnapshotImageForElement('[data-cy="project-link-proj1"]', 'project-card-mid-screen');
  });

});

