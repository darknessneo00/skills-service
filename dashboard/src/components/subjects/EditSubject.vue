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
  <ValidationObserver ref="observer" v-slot="{invalid, handleSubmit}" slim>
    <b-modal :id="subjectInternal.subjectId" size="xl" :title="title" v-model="show"
             :no-close-on-backdrop="true"
             :centered="true"
             header-bg-variant="primary"
             header-text-variant="light"
             @hide="publishHidden"
             no-fade>
        <b-container fluid>
          <div v-if="displayIconManager === false">
              <div class="media mb-3">
                <icon-picker :startIcon="subjectInternal.iconClass" @select-icon="toggleIconDisplay(true)"
                             class="mr-3"></icon-picker>
                <div class="media-body">
                  <div class="form-group">
                    <label for="subjName">Subject Name</label>
                    <ValidationProvider rules="required|minNameLength|maxSubjectNameLength|uniqueName" v-slot="{ errors }" name="Subject Name">
                      <input type="text" class="form-control" id="subjName" @input="updateSubjectId"
                             v-model="subjectInternal.name" v-on:input="updateSubjectId"
                             v-on:keyup.enter="handleSubmit(updateSubject)"
                             v-focus aria-required="true"
                              :aria-invalid="errors && errors.length > 0"
                              aria-errormessage="subjectNameError"
                              aria-describedby="subjectNameError"
                              data-cy="subjectNameInput">
                      <small class="form-text text-danger" id="subjectNameError">{{ errors[0] }}</small>
                    </ValidationProvider>
                  </div>
                </div>
              </div>

              <id-input type="text" label="Subject ID" v-model="subjectInternal.subjectId" @can-edit="canAutoGenerateId=!$event"
                        v-on:keyup.enter.native="handleSubmit(updateSubject)" additional-validation-rules="uniqueId"/>

              <div class="mt-2">
                <label>Description</label>
                <ValidationProvider rules="maxDescriptionLength|customDescriptionValidator" v-slot="{ errors }" name="Subject Description">
                  <markdown-editor v-model="subjectInternal.description"/>
                  <small class="form-text text-danger" data-cy="subjectDescError">{{ errors[0] }}</small>
                </ValidationProvider>
              </div>

              <div>
                <label for="subjectHelpUrl">Help URL/Path
                  <inline-help
                    msg="If project level 'Root Help Url' is specified then this path will be relative to 'Root Help Url'"/>
                </label>
                <ValidationProvider rules="help_url|customUrlValidator" v-slot="{errors}" name="Help URL/Path">
                  <input class="form-control" type="text" v-model="subjectInternal.helpUrl" v-on:keyup.enter="handleSubmit(updateSubject)"
                         id="subjectHelpUrl"
                         data-cy="subjectHelpUrl"
                         aria-describedby="subjectHelpUrlError"
                         aria-errormessage="subjectHelpUrlError"
                         :aria-invalid="errors && errors.length > 0"/>
                  <small class="form-text text-danger" id="subjectHelpUrlError" data-cy="subjectHelpUrlError">{{ errors[0] }}</small>
                </ValidationProvider>
              </div>

              <p v-if="invalid && overallErrMsg" class="text-center text-danger" role="alert">***{{ overallErrMsg }}***</p>
          </div>
          <div v-else>
              <icon-manager @selected-icon="onSelectedIcon"></icon-manager>
              <div class="text-right mr-2">
                <b-button variant="secondary" @click="toggleIconDisplay(false)" class="mt-4">Cancel Icon Selection</b-button>
              </div>
          </div>
        </b-container>

      <div slot="modal-footer" class="w-100">
        <div v-if="displayIconManager === false">
          <b-button variant="success"
                    size="sm"
                    class="float-right"
                    @click="handleSubmit(updateSubject)"
                    :disabled="invalid"
                    data-cy="saveSubjectButton">
            Save
          </b-button>
          <b-button variant="secondary" size="sm" class="float-right mr-2" @click="close" data-cy="closeSubjectButton">
            Cancel
          </b-button>
        </div>
      </div>
    </b-modal>
  </ValidationObserver>
</template>

<script>
  import { extend } from 'vee-validate';
  import SubjectsService from './SubjectsService';
  import IconPicker from '../utils/iconPicker/IconPicker';
  import MarkdownEditor from '../utils/MarkdownEditor';
  import IdInput from '../utils/inputForm/IdInput';
  import InputSanitizer from '../utils/InputSanitizer';
  import InlineHelp from '../utils/InlineHelp';

  export default {
    name: 'EditSubject',
    components: {
      IdInput,
      IconPicker,
      MarkdownEditor,
      InlineHelp,
      'icon-manager': () => import(/* webpackChunkName: 'iconManager' */'../utils/iconPicker/IconManager'),
    },
    props: {
      subject: Object,
      isEdit: Boolean,
      value: Boolean,
    },
    data() {
      return {
        canAutoGenerateId: true,
        subjectInternal: { originalSubjectId: this.subject.subjectId, isEdit: this.isEdit, ...this.subject },
        overallErrMsg: '',
        show: this.value,
        displayIconManager: false,
      };
    },
    created() {
      this.assignCustomValidation();
    },
    watch: {
      show(newValue) {
        this.$emit('input', newValue);
      },
    },
    computed: {
      title() {
        return this.isEdit ? 'Editing Existing Subject' : 'New Subject';
      },
    },
    methods: {
      publishHidden(e) {
        this.$emit('hidden', e);
      },
      close(e) {
        this.show = false;
        this.publishHidden(e);
      },
      updateSubject() {
        this.$refs.observer.validate()
          .then((res) => {
            if (!res) {
              this.overallErrMsg = 'Form did NOT pass validation, please fix and try to Save again';
            } else {
              this.close({ update: true });
              this.subjectInternal.subjectName = InputSanitizer.sanitize(this.subjectInternal.subjectName);
              this.subjectInternal.subjectId = InputSanitizer.sanitize(this.subjectInternal.subjectId);
              this.$emit('subject-saved', this.subjectInternal);
            }
          });
      },
      updateSubjectId() {
        if (!this.isEdit && this.canAutoGenerateId) {
          let id = InputSanitizer.removeSpecialChars(this.subjectInternal.name);
          // Subjects, skills and badges can not have same id under a project
          // by default append Subject to avoid id collision with other entities,
          // user can always override in edit mode
          if (id) {
            id = `${id}Subject`;
          }
          this.subjectInternal.subjectId = id;
        }
      },
      onSelectedIcon(selectedIcon) {
        this.subjectInternal.iconClass = `${selectedIcon.css}`;
        this.displayIconManager = false;
      },
      toggleIconDisplay(shouldDisplay) {
        this.displayIconManager = shouldDisplay;
      },
      assignCustomValidation() {
        // only want to validate for a new subject, existing subjects will override
        // name and subject id
        const self = this;
        extend('uniqueName', {
          message: (field) => `${field} is already taken.`,
          validate(value) {
            if (value === self.subject.name || (value && value.localeCompare(self.subject.name, 'en', { sensitivity: 'base' }) === 0)) {
              return true;
            }
            return SubjectsService.subjectWithNameExists(self.subjectInternal.projectId, value);
          },
        });

        extend('uniqueId', {
          message: (field) => `${field} is already taken.`,
          validate(value) {
            if (value === self.subject.subjectId) {
              return true;
            }
            return SubjectsService.subjectWithIdExists(self.subjectInternal.projectId, value);
          },
        });

        extend('help_url', {
          message: (field) => `${field} must use http, https, or be a relative url.`,
          validate(value) {
            if (!value) {
              return true;
            }
            return value.startsWith('http') || value.startsWith('https') || value.startsWith('/');
          },
        });
      },
    },
  };
</script>

<style scoped>

</style>
