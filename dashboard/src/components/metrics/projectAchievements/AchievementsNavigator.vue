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
  <ValidationObserver ref="observer" v-slot="{invalid}" slim>
    <metrics-card title="Achievements" :no-padding="true" data-cy="achievementsNavigator">
      <div class="row p-3">
        <div class="col-md border-right">
          <b-form-group label="User Name Filter:" label-for="user-name-filter" label-class="text-muted">
            <b-form-input id="user-name-filter" v-model="usernameFilter" v-on:keydown.enter="reloadTable" data-cy="achievementsNavigator-usernameInput"/>
          </b-form-group>
        </div>
          <div class="col-6 col-md border-right">
            <ValidationProvider rules="dateOrder" v-slot="{errors}" name="From Date"
                                ref="fromDateValidationProvider">
              <b-form-group label="From Date:" label-for="from-date-filter" label-class="text-muted">
                <b-form-datepicker aria-label="from date filter" id="from-date-filter" v-model="fromDayFilter" class="mb-2" data-cy="achievementsNavigator-fromDateInput">
                </b-form-datepicker>
              </b-form-group>
                <small class="form-text text-danger" v-show="errors[0]" data-cy="fromDateError">{{ errors[0] }}
                </small>
            </ValidationProvider>
          </div>
          <div class="col-6 col-md">
            <ValidationProvider rules="dateOrder" v-slot="{errors}" name="To Date"
                                ref="toDateValidationProvider">
              <b-form-group label="To Date:" label-for="to-date-filter" label-class="text-muted">
                <b-form-datepicker aria-label="to date filter" id="to-date-filter" v-model="toDayFilter" class="mb-2" data-cy="achievementsNavigator-toDateInput">
                </b-form-datepicker>
              </b-form-group>
              <small class="form-text text-danger" v-show="errors[0]" data-cy="toDateError">{{
                  errors[0]
                }}</small>
            </ValidationProvider>
          </div>
        </div>
        <div class="row px-3">
          <div class="col-xl border-right">
            <b-form-group label="Types:" label-class="text-muted" data-cy="achievementsNavigator-typeInput">
              <b-form-checkbox-group
                id="checkbox-group-1"
                v-model="achievementTypes.selected"
                :options="achievementTypes.available"
                name="flavour-1"
              >
              </b-form-checkbox-group>
            </b-form-group>
          </div>
          <div class="col-12 col-md-6 col-xl border-right">
            <b-form-group id="levels-input-group" label="Minimum Level (Subject & Skill Only):" label-for="input-3" label-class="text-muted">
              <b-form-select id="input-3" v-model="levels.selected" :options="levels.available" required data-cy="achievementsNavigator-levelsInput"/>
            </b-form-group>
          </div>
          <div class="col-12 col-md-6 col-xl">
            <b-form-group label="Name (Subject, Skill and Badge Only):" label-for="name-filter" label-class="text-muted">
              <b-form-input id="name-filter" v-model="nameFilter" v-on:keydown.enter="reloadTable" data-cy="achievementsNavigator-nameInput"/>
            </b-form-group>
          </div>
        </div>
        <div class="row pl-3 mb-2">
          <div class="col">
            <b-button variant="outline-primary" @click="reloadTable" data-cy="achievementsNavigator-filterBtn" :disabled="invalid"><i class="fa fa-filter"/> Filter</b-button>
            <b-button variant="outline-primary" @click="reset" class="ml-1" data-cy="achievementsNavigator-resetBtn"><i class="fa fa-times"/> Reset</b-button>
          </div>
        </div>

        <skills-b-table class="mb-5" data-cy="achievementsNavigator-table"
                        :items="items" :options="tableOptions"
                        @sort-changed="sortTable" @page-changed="pageChanged" @page-size-changed="pageSizeChanged">
          <template v-slot:cell(username)="data">
            <div class="row">
              <div class="col-12 col-md-8">
                <span>{{ data.value }}</span>
              </div>
              <div class="col-12 col-md-4 text-md-right">
                <b-button :to="{ name: 'ClientDisplayPreview', params: { projectId: projectId, userId: data.item.userId } }"
                          variant="outline-info" size="sm" class="text-secondary"
                          v-b-tooltip.hover title="View User's Client Display" data-cy="achievementsNavigator-clientDisplayBtn"><i class="fa fa-eye"/></b-button>
              </div>
            </div>
          </template>
          <template v-slot:cell(type)="data">
            <achievement-type :type="data.value" />
          </template>
          <template v-slot:cell(name)="data" data-cy="achievementsNavigator-table-skillName">
            <span v-if="data.value == 'Overall'" class="small text-muted">
              N/A
            </span>
            <span v-else>{{ data.value }}</span>
          </template>
          <template v-slot:cell(level)="data">
            <span v-if="!data.value" class="small text-muted">
              N/A
            </span>
            <span v-else>{{ data.value }}</span>
          </template>
          <template v-slot:cell(achievedOn)="data">
            <span class="">{{ data.value | date }}</span>
            <b-badge v-if="isToday(data.value)" variant="info" class="ml-2">Today</b-badge>
            <div class="small text-muted">
              {{ data.value | timeFromNow }}
            </div>
          </template>
        </skills-b-table>
    </metrics-card>
  </ValidationObserver>
</template>

<script>
  import { extend } from 'vee-validate';
  import SkillsBTable from '../../utils/table/SkillsBTable';
  import MetricsService from '../MetricsService';
  import AchievementType from './AchievementType';
  import MetricsCard from '../utils/MetricsCard';
  import dayjs from '../../../DayJsCustomizer';

  /*
   Provider's reset() method triggers an infinite loop if we use it in dateOrder
   we need to explicitly set the flags and manually clear errors
  */
  const resetProvider = (provider) => {
    if (provider) {
      provider.setErrors([]);
      provider.setFlags({
        valid: true,
        invalid: false,
        passed: true,
        failed: false,
      });
    }
  };

  export default {
    name: 'AchievementsNavigator',
    components: { MetricsCard, AchievementType, SkillsBTable },
    mounted() {
      this.customValidation();
      this.reloadTable();
    },
    data() {
      return {
        isLoading: true,
        projectId: this.$route.params.projectId,
        usernameFilter: '',
        fromDayFilter: '',
        toDayFilter: '',
        nameFilter: '',
        levels: {
          selected: '',
          available: [
            { value: '', text: 'Optionally select level' },
            { value: 1, text: 'Level 1' },
            { value: 2, text: 'Level 2' },
            { value: 3, text: 'Level 3' },
            { value: 4, text: 'Level 4' },
            { value: 5, text: 'Level 5' },
          ],
        },
        achievementTypes: {
          selected: ['Overall', 'Subject', 'Skill', 'Badge'],
          available: ['Overall', 'Subject', 'Skill', 'Badge'],
        },
        tableOptions: {
          busy: true,
          sortBy: 'achievedOn',
          sortDesc: true,
          bordered: true,
          outlined: true,
          rowDetailsControls: false,
          stacked: 'md',
          fields: [
            {
              key: 'userName',
              sortable: true,
              label: 'Username',
            },
            {
              key: 'type',
              sortable: false,
            },
            {
              key: 'name',
              sortable: false,
            },
            {
              key: 'level',
              sortable: false,
            },
            {
              key: 'achievedOn',
              label: 'Date',
              sortable: true,
            },
          ],
          pagination: {
            server: true,
            currentPage: 1,
            totalRows: 0,
            pageSize: 5,
            possiblePageSizes: [5, 10, 15, 20, 50],
          },
        },
        items: [],
      };
    },
    methods: {
      pageChanged(pageNum) {
        this.tableOptions.pagination.currentPage = pageNum;
        this.reloadTable();
      },
      pageSizeChanged(newSize) {
        this.tableOptions.pagination.pageSize = newSize;
        this.reloadTable();
      },
      sortTable(sortContext) {
        this.tableOptions.sortBy = sortContext.sortBy;
        this.tableOptions.sortDesc = sortContext.sortDesc;

        // set to the first page
        this.tableOptions.pagination.currentPage = 1;
        this.reloadTable();
      },
      customValidation() {
        const self = this;
        extend('dateOrder', {
          message: 'From Date must come before To Date',
          validate() {
            let valid = true;
            if (self.fromDayFilter && self.toDayFilter) {
              valid = dayjs(self.fromDayFilter).isBefore(dayjs(self.toDayFilter));
              if (valid) {
                // manually clear errors in case the orig error occurred when setting startDate,
                // but was fixed by updating endDate (or vise-versa)
                resetProvider(self.$refs.fromDateValidationProvider);
                resetProvider(self.$refs.toDateValidationProvider);
              }
            }
            return valid;
          },
        });
      },
      reset() {
        this.usernameFilter = '';
        this.tableOptions.pagination.currentPage = 1;
        this.fromDayFilter = '';
        this.toDayFilter = '';
        this.nameFilter = '';
        this.levels.selected = '';
        this.achievementTypes.selected = this.achievementTypes.available;
        this.reloadTable();
      },
      reloadTable() {
        this.tableOptions.busy = true;
        const params = {
          pageSize: this.tableOptions.pagination.pageSize,
          currentPage: this.tableOptions.pagination.currentPage,
          usernameFilter: this.usernameFilter,
          fromDayFilter: this.fromDayFilter,
          toDayFilter: this.toDayFilter,
          nameFilter: this.nameFilter,
          minLevel: this.levels.selected,
          achievementTypes: this.achievementTypes.selected,
          sortBy: this.tableOptions.sortBy,
          sortDesc: this.tableOptions.sortDesc,
        };

        MetricsService.loadChart(this.$route.params.projectId, 'userAchievementsChartBuilder', params)
          .then((dataFromServer) => {
            this.isLoading = false;
            this.items = dataFromServer.items;
            this.tableOptions.pagination.totalRows = dataFromServer.totalNumItems;
            this.tableOptions.busy = false;
          });
      },
      isToday(timestamp) {
        return dayjs(timestamp)
          .isSame(new Date(), 'day');
      },
    },
    watch: {
      'tableOptions.pagination.pageSize': function pageSizeUpdate() {
        if (this.tableOptions.pagination.currentPage > 1) {
          // will reload the table in currentPage watch
          this.tableOptions.pagination.currentPage = 1;
        } else {
          this.reloadTable();
        }
      },
    },
  };
</script>

<style lang="scss" scoped>
@import "../../../assets/custom";

.customPagination /deep/ button {
  color: $info !important;
  border-color: $secondary !important;
}

.customPagination /deep/ .disabled > .page-link {
  border-color: $secondary !important;
}

.customPagination /deep/ .active > button {
  background-color: $info !important;
  color: $white !important;
}

</style>
