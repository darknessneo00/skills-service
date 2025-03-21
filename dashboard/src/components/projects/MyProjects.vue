/*
Copyright 2020 SkillTree

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
<template>
  <div>
    <sub-page-header title="Projects" action="Project"
                     :disabled="addProjectDisabled" :disabled-msg="addProjectsDisabledMsg">
          <b-button v-if="isRootUser" variant="outline-primary" ref="pinProjectsButton"
                    @click="showSearchProjectModal=true"
                    size="sm"
                    class="mr-2">
            <span class="d-none d-sm-inline">Pin</span> <i class="fas fa-thumbtack" aria-hidden="true"/>
          </b-button>
          <b-button id="newProjectBtn" ref="newProjButton" @click="editNewProject()" variant="outline-primary" size="sm"
                    data-cy="newProjectButton">
            <span class="d-none d-sm-inline">Project</span> <i class="fas fa-plus-circle" aria-hidden="true"/>
          </b-button>
    </sub-page-header>

    <loading-container v-bind:is-loading="isLoading">
      <div v-if="useTableView">
        <projects-table :projects="projects" @project-deleted="projectRemoved" @edit-project="editProject"></projects-table>
      </div>
      <div v-else id="projectCards">
        <div v-for="project of projects" :key="project.projectId" class="mb-3"  :id="project.projectId">
          <b-overlay :show="sortOrder.loading" rounded="sm" opacity="0.4">
            <template #overlay>
              <div class="text-center" :data-cy="`${project.projectId}_overlayShown`">
                <div v-if="project.projectId===sortOrder.loadingProjectId" data-cy="updatingSortMsg">
                  <div class="text-info text-uppercase mb-1">Updating sort order!</div>
                  <b-spinner label="Loading..." style="width: 3rem; height: 3rem;" variant="info"/>
                </div>
              </div>
            </template>
            <my-project :project="project" :disable-sort-control="projects.length === 1"
                      v-on:project-deleted="projectRemoved" v-on:pin-removed="loadProjects" />
          </b-overlay>
        </div>
      </div>

      <no-content2 v-if="!projects || projects.length==0" icon="fas fa-hand-spock" class="mt-4"
                   title="No Projects Yet..." message="A Project is an overall container that represents the skills ruleset for a single application with gamified training.">
        <div class="mt-3">
          <span v-if="!isRootUser" class="text-muted" style="font-size: .90em">
            Note: This section of SkillTree is for <strong>project administrators only</strong>. If you do not plan on creating and integrating a project with SkillTree then please return to the
            <router-link to="/">
              <span class="skill-url">Progress and Ranking</span>
            </router-link> page.
          </span>
        </div>
      </no-content2>
    </loading-container>

    <edit-project v-if="newProject.show" v-model="newProject.show" :project="newProject.project"
                  @project-saved="projectAdded" @hidden="handleHide" :is-edit="newProject.isEdit"/>
    <pin-projects v-if="showSearchProjectModal" v-model="showSearchProjectModal" @done="pinModalClosed"/>

  </div>

</template>

<script>
  import Sortable from 'sortablejs';
  import { SkillsReporter } from '@skilltree/skills-client-vue';
  import MyProject from './MyProject';
  import EditProject from './EditProject';
  import LoadingContainer from '../utils/LoadingContainer';
  import ProjectService from './ProjectService';
  import SubPageHeader from '../utils/pages/SubPageHeader';
  import NoContent2 from '../utils/NoContent2';
  import PinProjects from './PinProjects';
  import ProjectsTable from './ProjectsTable';
  import SettingsService from '../settings/SettingsService';

  export default {
    name: 'MyProjects',
    data() {
      return {
        isLoading: true,
        projects: [],
        newProject: {
          show: false,
          isEdit: false,
          project: { name: '', projectId: '' },
        },
        showSearchProjectModal: false,
        sortOrder: {
          loading: false,
          loadingProjectId: '-1',
        },
      };
    },
    components: {
      PinProjects,
      NoContent2,
      SubPageHeader,
      LoadingContainer,
      MyProject,
      EditProject,
      ProjectsTable,
    },
    mounted() {
      this.loadProjects();
    },
    computed: {
      addProjectDisabled() {
        return this.projects && this.$store.getters.config && this.projects.length >= this.$store.getters.config.maxProjectsPerAdmin;
      },
      addProjectsDisabledMsg() {
        if (this.$store.getters.config) {
          return `The maximum number of Projects allowed is ${this.$store.getters.config.maxProjectsPerAdmin}`;
        }
        return '';
      },
      isRootUser() {
        return this.$store.getters['access/isRoot'];
      },
      useTableView() {
        return this.projects && this.$store.getters.config && this.projects.length >= this.$store.getters.config.numProjectsForTableView;
      },
    },
    methods: {
      handleHide() {
        this.$nextTick(() => {
          this.$refs.newProjButton.focus();
        });
      },
      pinModalClosed() {
        this.showSearchProjectModal = false;
        this.loadProjects();
        this.$nextTick(() => {
          this.$refs.pinProjectsButton.focus();
        });
      },
      loadProjects() {
        this.isLoading = true;
        ProjectService.getProjects()
          .then((response) => {
            this.projects = response;
          })
          .finally(() => {
            this.isLoading = false;
            this.enableDropAndDrop();
          });
      },
      projectRemoved(project) {
        this.isLoading = true;
        ProjectService.deleteProject(project.projectId)
          .then(() => {
            this.loadProjects();
          });
      },
      projectAdded(project) {
        this.isLoading = true;
        ProjectService.saveProject(project)
          .then(() => {
            if (this.isRootUser) {
              SettingsService.pinProject(project.projectId)
                .then(() => {
                  this.loadProjects();
                  SkillsReporter.reportSkill('CreateProject');
                });
            } else {
              this.loadProjects();
              SkillsReporter.reportSkill('CreateProject');
            }
          });
      },
      editNewProject() {
        this.newProject = {
          show: true,
          isEdit: false,
          project: { name: '', projectId: '' },
        };
      },
      editProject(projectToEdit) {
        this.newProject = {
          show: true,
          isEdit: true,
          project: projectToEdit,
        };
      },
      enableDropAndDrop() {
        if (this.projects && this.projects.length > 0
          && this.$store.getters.config && this.projects.length < this.$store.getters.config.numProjectsForTableView) {
          const self = this;
          this.$nextTick(() => {
            const cards = document.getElementById('projectCards');
            Sortable.create(cards, {
              handle: '.sort-control',
              animation: 150,
              ghostClass: 'skills-sort-order-ghost-class',
              onUpdate(event) {
                self.sortOrderUpdate(event);
              },
            });
          });
        }
      },
      sortOrderUpdate(updateEvent) {
        const { id } = updateEvent.item;
        this.sortOrder.loadingProjectId = id;
        this.sortOrder.loading = true;
        ProjectService.updateProjectDisplaySortOrder(id, updateEvent.newIndex)
          .finally(() => {
            this.sortOrder.loading = false;
          });
      },
    },
  };
</script>
