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
  <b-card body-class="p-0 d-flex flex-column">
    <div class="flex-grow-1">
      <b-row class="justify-content-between no-gutters pl-3 mr-2 pt-3 pb-0">
        <b-col cols="5">
          <div class="text-uppercase text-secondary">Projects</div>
          <div class="mt-2 ml-1 text-dark">
            <span style="font-size: 2.5rem;" data-cy="numProjectsContributed">{{ numProjectsContributed }}</span> <span class="text-secondary" style="font-size: 1.2rem;" data-cy="numProjectsAvailable">/ {{ projects.length }}</span>
          </div>
        </b-col>
        <b-col cols="7">
          <apexchart type="radialBar" height="200" :options="chartOptions" :series="series"></apexchart>
        </b-col>
      </b-row>
    </div>
    <b-row class="justify-content-between no-gutters border-top text-muted small"  style="min-height: 3rem;">
      <b-col class="p-2">
        <b-row :no-gutters="true">
          <b-col class="text-truncate">
            <span v-if="projectsNotContributedToYet > 0"
                  data-cy="info-snap-footer"
                  :title="`You still have ${projectsNotContributedToYet} project${ projectsNotContributedToYet > 1 ? 's' : ''} to explore.`">
              You still have <b-badge variant="info">{{ projectsNotContributedToYet }}</b-badge> project{{ projectsNotContributedToYet > 1 ? 's' : ''}} to explore.
            </span>
            <span v-else data-cy="info-snap-footer" class="text-nowrap" title="Great job, you have contributed to all projects!">Great job, you have contributed to all projects!</span>
          </b-col>
          <b-col cols="auto">
            <span class="float-right"><b-button :to="{ name: 'MyUsagePage', params: { projects } }" variant="outline-info" size="sm" data-cy="viewUsageBtn"><i class="fas fa-eye"/> Usage</b-button></span>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
  export default {
    name: 'InfoSnapshotCard',
    props: {
      projects: {
        type: Array,
        required: true,
      },
      numProjectsContributed: {
        type: Number,
        required: true,
      },
    },
    data() {
      return {
        chartOptions: {
          chart: {
            height: 200,
            type: 'radialBar',
            toolbar: {
              show: false,
            },
          },
          grid: {
            padding: {
              top: -10,
              bottom: -15,
            },
          },
          plotOptions: {
            radialBar: {
              startAngle: -135,
              endAngle: 225,
              hollow: {
                margin: 0,
                size: '75%',
                background: '#fff',
                image: undefined,
                imageOffsetX: 0,
                imageOffsetY: 0,
                position: 'front',
                dropShadow: {
                  enabled: true,
                  top: 3,
                  left: 0,
                  blur: 4,
                  opacity: 0.24,
                },
              },
              track: {
                background: '#fff',
                strokeWidth: '67%',
                margin: 0, // margin is in pixels
                dropShadow: {
                  enabled: true,
                  top: -3,
                  left: 0,
                  blur: 4,
                  opacity: 0.35,
                },
              },

              dataLabels: {
                show: true,
                name: {
                  offsetY: -10,
                  show: true,
                  color: '#888',
                  fontSize: '16px',
                },
                value: {
                  formatter(val) {
                    return `${val} %`;
                  },
                  offsetY: 0,
                  color: '#888',
                  fontSize: '22px',
                  show: true,
                },
              },
            },
          },
          fill: {
            type: 'gradient',
            gradient: {
              shade: 'dark',
              type: 'horizontal',
              shadeIntensity: 0.5,
              gradientToColors: ['#7ED6F3'],
              inverseColors: true,
              opacityFrom: 1,
              opacityTo: 1,
              stops: [0, 100],
            },
          },
          stroke: {
            lineCap: 'round',
          },
          labels: ['Percent'],
        },
      };
    },
    computed: {
      series() {
        const percent = (this.numProjectsContributed / this.projects.length) * 100;
        if (percent > 0) {
          if (percent < 1) {
            return [1];
          }
          return [Math.round(percent)];
        }
        return [0];
      },
      projectsNotContributedToYet() {
        return this.projects.length - this.numProjectsContributed;
      },
    },
  };
</script>

<style scoped>

</style>
