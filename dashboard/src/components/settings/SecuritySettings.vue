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
    <sub-page-header title="Security Settings"/>

    <metrics-card title="Root Users Management" :no-padding="true">
      <role-manager id="add-root-user" ref="rootUserRoleManager"
                    @role-added="handleRootRoleChanged"
                    @role-deleted="handleRootRoleChanged"
                    data-cy="rootrm" :role="root.role" :user-type="root.userType" :role-description="root.roleDescription" />
    </metrics-card>

    <metrics-card title="Supervisor Users Management" :no-padding="true" class="mt-3">
      <role-manager id="add-supervisor-user" ref="supervisorRoleManager"
                    data-cy="supervisorrm" :role="supervisor.role"
                    :user-type="supervisor.userType"
                    :role-description="supervisor.roleDescription"
                    @role-added="handleRoleAdded"
                    @role-deleted="handleRoleDeleted"/>
    </metrics-card>
  </div>
</template>

<script>
  import MetricsCard from '@/components/metrics/utils/MetricsCard';
  import RoleManager from '../access/RoleManager';
  import SubPageHeader from '../utils/pages/SubPageHeader';

  export default {
    name: 'SecuritySettings',
    components: { MetricsCard, SubPageHeader, RoleManager },
    data() {
      return {
        root: {
          role: 'ROLE_SUPER_DUPER_USER',
          roleDescription: 'Root User',
          userType: 'ROOT',
        },
        supervisor: {
          role: 'ROLE_SUPERVISOR',
          roleDescription: 'Supervisor User',
          userType: 'SUPERVISOR',
        },
      };
    },
    methods: {
      handleRootRoleChanged() {
        this.$refs.supervisorRoleManager.loadData();
      },
      handleRoleAdded(event) {
        if (this.$store.getters.userInfo
          && event.userId === this.$store.getters.userInfo.userId
          && event.role === this.supervisor.role) {
          this.$store.commit('access/supervisor', true);
        }
      },
      handleRoleDeleted(event) {
        if (this.$store.getters.userInfo
          && event.userId === this.$store.getters.userInfo.userId
          && event.role === this.supervisor.role) {
          this.$store.commit('access/supervisor', false);
        }
      },
    },
  };
</script>

<style scoped>

</style>
