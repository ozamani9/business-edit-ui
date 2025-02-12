<template>
  <v-container id="action-buttons-container" class="list-item">
    <!-- don't show buttons until Entity Type is identified -->
    <template v-if="!!getEntityType">
      <div class="buttons-left">
        <!-- disable Save button for now -->
        <v-btn id="save-btn" large
          :disabled="isSaveButtonDisabled"
          :loading="isSaving"
          @click="onClickSave()"
        >
          <span>Save</span>
        </v-btn>

        <!-- disable Save and Resume Later button for now -->
        <v-btn id="save-resume-btn" large
          :disabled="isSaveResumeButtonDisabled"
          :loading="isSavingResuming"
          @click="onClickSaveResume()"
        >
          <span>Save and Resume Later</span>
        </v-btn>
      </div>

      <div class="buttons-right">
        <v-fade-transition hide-on-leave>
          <v-btn id="file-pay-btn" large color="primary"
            :disabled="isFilePayButtonDisabled"
            :loading="isFilingPaying"
            @click="onClickFilePay()"
          >
            <span>File and Pay</span>
          </v-btn>
        </v-fade-transition>

        <v-btn id="app-cancel-btn" large outlined color="primary"
          :disabled="isBusySaving"
          @click="onClickCancel()"
        >
          <span>Cancel</span>
        </v-btn>
      </div>
    </template>
  </v-container>
</template>

<script lang="ts">
// Libraries
import { Component, Mixins } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'

// Interfaces and Enums
import { ActionBindingIF } from '@/interfaces'
import { CorpTypeCd } from '@/enums'

// Mixins
import { DateMixin, FilingTemplateMixin, LegalApiMixin, NameRequestMixin } from '@/mixins'
import { navigate } from '@/utils'

/** This component is only implemented for Correction filings atm. */
@Component({})
export default class Actions extends Mixins(DateMixin, FilingTemplateMixin, LegalApiMixin, NameRequestMixin) {
  // Global getters
  @Getter getEntityType!: CorpTypeCd
  @Getter isBusySaving!: boolean
  @Getter isNamedBusiness!: boolean
  @Getter getNameRequestNumber!: string
  @Getter hasCorrectionChanged!: boolean
  @Getter hasAlterationChanged!: boolean // for testing state-getters
  @Getter isFilingValid!: boolean
  @Getter hasNewNr!: boolean
  @Getter isSaving!: boolean
  @Getter isSavingResuming!: boolean
  @Getter isFilingPaying!: boolean
  @Getter isEditing!: boolean

  // Global actions
  @Action setIsSaving!: ActionBindingIF
  @Action setIsSavingResuming!: ActionBindingIF
  @Action setIsFilingPaying!: ActionBindingIF
  @Action setHaveUnsavedChanges!: ActionBindingIF

  /** True if the Save button should be disabled. */
  private get isSaveButtonDisabled (): boolean {
    return (this.isBusySaving || this.isEditing)
  }

  /** True if the Save and Resume button should be disabled. */
  private get isSaveResumeButtonDisabled (): boolean {
    return (this.isBusySaving || this.isEditing)
  }

  /** True if the File and Pay button should be disabled. */
  private get isFilePayButtonDisabled (): boolean {
    return (!this.hasCorrectionChanged || this.isBusySaving || !this.isFilingValid || this.isEditing)
  }

  /**
   * Called when Save button is clicked.
   * @returns a promise (ie, this is an async method)
   */
  private async onClickSave (): Promise<void> {
    // prevent double saving
    if (this.isBusySaving) return
    this.setIsSaving(true)

    let filingComplete: any
    try {
      const filing = await this.buildIaCorrectionFiling(true)
      filingComplete = await this.updateFiling(filing, true)
      // clear flag
      this.setHaveUnsavedChanges(false)
    } catch (error) {
      this.$root.$emit('save-error-event', error)
      this.setIsSaving(false)
      return
    }

    this.setIsSaving(false)
  }

  /**
   * Called when Save and Resume Later button is clicked.
   * @returns a promise (ie, this is an async method)
   */
  private async onClickSaveResume (): Promise<void> {
    // prevent double saving
    if (this.isBusySaving) return
    this.setIsSavingResuming(true)

    let filingComplete: any
    try {
      const filing = await this.buildIaCorrectionFiling(true)
      filingComplete = await this.updateFiling(filing, true)
      // clear flag
      this.setHaveUnsavedChanges(false)
    } catch (error) {
      this.$root.$emit('save-error-event', error)
      this.setIsSavingResuming(false)
      return
    }

    this.setIsSavingResuming(false)
    this.$root.$emit('go-to-dashboard')
  }

  /**
   * Called when File and Pay button is clicked.
   * @returns a promise (ie, this is an async method)
   */
  private async onClickFilePay (): Promise<void> {
    // prevent double saving
    if (this.isBusySaving) return
    this.setIsFilingPaying(true)

    // If this is a named company IA, validate NR before filing submission. This method is different
    // from the processNameRequest method in App.vue. This method shows a generic message if
    // the Name Request is not valid and clicking ok in the pop up redirects to the Manage Businesses
    // dashboard.
    if (this.isNamedBusiness && this.hasNewNr) {
      try {
        await this.validateNameRequest(this.getNameRequestNumber)
      } catch (error) {
        // "validateNameRequest" handles its own errors
        this.setIsFilingPaying(false)
        return
      }
    }

    let filingComplete: any
    try {
      const filing = await this.buildIaCorrectionFiling(false)
      filingComplete = await this.updateFiling(filing, false)
      // clear flag
      this.setHaveUnsavedChanges(false)
    } catch (error) {
      this.$root.$emit('save-error-event', error)
      this.setIsFilingPaying(false)
      return
    }

    const paymentToken = filingComplete?.header?.paymentToken
    if (paymentToken) {
      const isPaymentActionRequired: boolean = filingComplete.header?.isPaymentActionRequired
      const dashboardUrl = sessionStorage.getItem('DASHBOARD_URL')

      // if payment action is required, navigate to Pay URL
      if (isPaymentActionRequired) {
        const authUrl = sessionStorage.getItem('AUTH_WEB_URL')
        const returnUrl = encodeURIComponent(dashboardUrl + this.getBusinessId)
        const payUrl = authUrl + 'makepayment/' + paymentToken + '/' + returnUrl
        // assume Pay URL is always reachable
        // otherwise user will have to retry payment later
        navigate(payUrl)
      } else {
        // otherwise go straight to dashboard
        this.$root.$emit('go-to-dashboard')
      }
    } else {
      const error = new Error('Missing Payment Token')
      this.$root.$emit('save-error-event', error)
      this.setIsFilingPaying(false)
    }
  }

  /** Called when Cancel button is clicked. */
  private onClickCancel (): void {
    this.$root.$emit('go-to-dashboard')
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/theme.scss';

#action-buttons-container {
  background-color: $gray1;
  margin-top: 2rem;
  padding-top: 2rem;
  padding-bottom: 2rem;
  border-top: 1px solid $gray5;

  .buttons-left {
    width: 50%;
  }

  .buttons-right {
    margin-left: auto;
  }

  .v-btn + .v-btn {
    margin-left: 0.5rem;
  }
}
</style>
