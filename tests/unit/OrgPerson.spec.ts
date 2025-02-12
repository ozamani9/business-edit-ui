import Vue from 'vue'
import Vuetify from 'vuetify'
import Vuelidate from 'vuelidate'
import { mount, Wrapper, createLocalVue } from '@vue/test-utils'
import flushPromises from 'flush-promises'
import { OrgPerson } from '@/components/common'
import { getVuexStore } from '@/store'
import { FilingTypes } from '@/enums'
import { GeneralPartnershipResource } from '@/resources/Edit/ChangeFirm'
import { BenefitCompanyStatementResource } from '@/resources'

Vue.use(Vuetify)
Vue.use(Vuelidate)

const vuetify = new Vuetify({})
const store = getVuexStore()

// Events
const addEditEvent = 'addEdit'
const removeEvent = 'remove'
const resetEvent = 'reset'
const removeCpRoleEvent = 'removeCpRole'

// Input field selectors to test changes to the DOM elements.
const firstNameSelector = '#person__first-name'
const middleNameSelector = '#person__middle-name'
const lastNameSelector = '#person__last-name'
const orgNameSelector = '#firm-name'
const completingPartyChkBoxSelector = '#cp-checkbox'
const incorporatorChkBoxSelector = '#incorp-checkbox'
const directorChkBoxSelector = '#dir-checkbox'
const removeButtonSelector = '#btn-remove'
const doneButtonSelector = '#btn-done'
const cancelButtonSelector = '#btn-cancel'
const orgPersonFormSelector = '#org-person-form'

const validPersonData = {
  officer: {
    id: '0',
    firstName: 'Adam',
    lastName: 'Smith',
    middleName: 'D',
    organizationName: '',
    partyType: 'person',
    email: 'completing-party@example.com'
  },
  roles: [
    { roleType: 'Director', appointmentDate: '2020-03-30' },
    { roleType: 'Completing Party', appointmentDate: '2020-03-30' }
  ],
  mailingAddress: {
    streetAddress: '123 Fake Street',
    streetAddressAdditional: '',
    addressCity: 'Victoria',
    addressRegion: 'BC',
    postalCode: 'V8Z 5C6',
    addressCountry: 'CA'
  },
  deliveryAddress: {
    streetAddress: '123 Fake Street',
    streetAddressAdditional: '',
    addressCity: 'Victoria',
    addressRegion: 'BC',
    postalCode: 'V8Z 5C6',
    addressCountry: 'CA'
  }
}

const validIncorporator = {
  officer: {
    id: '1',
    firstName: 'Adam',
    lastName: 'Smith',
    middleName: 'D',
    organizationName: '',
    partyType: 'person'
  },
  roles: [
    { roleType: 'Incorporator', appointmentDate: '2020-03-30' }
  ],
  mailingAddress: {
    streetAddress: '123 Fake Street',
    streetAddressAdditional: '',
    addressCity: 'Victoria',
    addressRegion: 'BC',
    postalCode: 'V8Z 5C6',
    addressCountry: 'CA'
  },
  deliveryAddress: {
    streetAddress: '123 Fake Street',
    streetAddressAdditional: '',
    addressCity: 'Victoria',
    addressRegion: 'BC',
    postalCode: 'V8Z 5C6',
    addressCountry: 'CA'
  }
}

const validOrgData = {
  officer: {
    id: '2',
    firstName: '',
    lastName: '',
    middleName: '',
    organizationName: 'Test Org',
    partyType: 'organization'
  },
  roles: [
    { roleType: 'Incorporator', appointmentDate: '2020-03-30' }
  ],
  mailingAddress: {
    streetAddress: '3942 Fake Street',
    streetAddressAdditional: '',
    addressCity: 'Victoria',
    addressRegion: 'BC',
    postalCode: 'V8Z 5C6',
    addressCountry: 'CA'
  }
}

const emptyPerson = {
  officer: {
    id: null as string,
    firstName: '',
    lastName: '',
    middleName: '',
    organizationName: '',
    partyType: 'person',
    email: null as string
  },
  roles: [] as [],
  mailingAddress: {
    streetAddress: '',
    streetAddressAdditional: '',
    addressCity: '',
    addressRegion: '',
    postalCode: '',
    addressCountry: '',
    deliveryInstructions: ''
  },
  action: null as string
}

/**
 * Returns the last event for a given name, to be used for testing event propagation in response to component changes.
 * @param wrapper the wrapper for the component that is being tested
 * @param name the name of the event that is to be returned
 * @returns the value of the last named event for the wrapper
 */
function getLastEvent (wrapper: Wrapper<OrgPerson>, name: string): any {
  const eventsList = wrapper.emitted(name)
  if (eventsList) {
    const events = eventsList[eventsList.length - 1]
    return events[0]
  }
  return null
}

/**
 * Creates and mounts a component, so that it can be tested.
 * @returns a Wrapper<OrgPerson> object with the given parameters.
 */
function createComponent (
  currentOrgPerson: any,
  activeIndex: number = NaN,
  currentCompletingParty: any
): Wrapper<OrgPerson> {
  const localVue = createLocalVue()
  localVue.use(Vuetify)
  document.body.setAttribute('data-app', 'true')

  return mount(OrgPerson, {
    localVue,
    propsData: { currentOrgPerson, activeIndex, currentCompletingParty },
    store,
    vuetify
  })
}

describe('Org/Person component for Correction', () => {
  beforeAll(() => {
    store.state.stateModel.tombstone.filingType = FilingTypes.CORRECTION
    store.state.stateModel.nameRequest.entityType = 'BEN'
    store.state.stateModel.tombstone.currentDate = '2020-03-30'
    store.state.resourceModel = BenefitCompanyStatementResource
  })

  it('Loads the component and sets data for person', async () => {
    const wrapper = createComponent(validPersonData, NaN, null)
    await Vue.nextTick()

    expect(wrapper.vm.$data.orgPerson).toStrictEqual(validPersonData)
    expect((wrapper.vm as any).isIncorporator).toBe(false)
    expect((wrapper.vm as any).isDirector).toBe(true)
    expect((wrapper.vm as any).isCompletingParty).toBe(true)

    wrapper.destroy()
  })

  it('Loads the component and sets data for org', async () => {
    const wrapper = createComponent(validOrgData, NaN, null)
    await Vue.nextTick()

    expect(wrapper.vm.$data.orgPerson).toStrictEqual(validOrgData)
    expect((wrapper.vm as any).isIncorporator).toBe(true)
    expect((wrapper.vm as any).isDirector).toBe(false)
    expect((wrapper.vm as any).isCompletingParty).toBe(false)

    wrapper.destroy()
  })

  // NB: edit functions the same as add for a person
  it('Displays edit form for person', async () => {
    const wrapper = createComponent(validPersonData, 0, null)
    await Vue.nextTick()

    // verify person's name
    expect((wrapper.find(firstNameSelector).element as HTMLInputElement).value)
      .toEqual(validPersonData['officer']['firstName'])
    expect((wrapper.find(middleNameSelector).element as HTMLInputElement).value)
      .toEqual(validPersonData['officer']['middleName'])
    expect((wrapper.find(lastNameSelector).element as HTMLInputElement).value)
      .toEqual(validPersonData['officer']['lastName'])

    // verify role checkboxes
    expect(wrapper.find(completingPartyChkBoxSelector).attributes('aria-checked')).toBe('true')
    expect(wrapper.find(incorporatorChkBoxSelector).attributes('aria-checked')).toBe('false')
    expect(wrapper.find(directorChkBoxSelector).attributes('aria-checked')).toBe('true')

    // verify that all role checkboxes are enabled
    expect(wrapper.find(completingPartyChkBoxSelector).attributes('disabled')).toBeUndefined()
    expect(wrapper.find(incorporatorChkBoxSelector).attributes('disabled')).toBeUndefined()
    expect(wrapper.find(directorChkBoxSelector).attributes('disabled')).toBeUndefined()

    // verify action buttons
    expect(wrapper.find(doneButtonSelector).attributes('disabled')).toBeUndefined()
    expect(wrapper.find(removeButtonSelector).attributes('disabled')).toBeUndefined()
    expect(wrapper.find(cancelButtonSelector).attributes('disabled')).toBeUndefined()

    wrapper.destroy()
  })

  // NB: add functions the same as edit for an org
  it('Displays add form for org', async () => {
    const wrapper = createComponent(validOrgData, NaN, null)
    await Vue.nextTick()

    // verify org's name
    expect((wrapper.find(orgNameSelector).element as HTMLInputElement).value)
      .toEqual(validOrgData['officer']['organizationName'])

    // verify role checkboxes
    expect(wrapper.find(completingPartyChkBoxSelector).exists()).toBe(false)
    expect(wrapper.find(incorporatorChkBoxSelector).attributes('aria-checked')).toBe('true')
    expect(wrapper.find(directorChkBoxSelector).exists()).toBe(false)

    // verify that role checkbox is disabled (ie, role is locked)
    expect(wrapper.find(incorporatorChkBoxSelector).attributes('disabled')).toBe('disabled')

    // verify action buttons
    expect(wrapper.find(doneButtonSelector).attributes('disabled')).toBeUndefined()
    expect(wrapper.find(removeButtonSelector).attributes('disabled')).toBeDefined()
    expect(wrapper.find(cancelButtonSelector).attributes('disabled')).toBeUndefined()

    wrapper.destroy()
  })

  it('Enables Remove button in edit mode', async () => {
    const wrapper = createComponent(validOrgData, 0, null)

    expect(wrapper.find(removeButtonSelector).attributes('disabled')).toBeUndefined()

    wrapper.destroy()
  })

  it('Disables Remove button in create mode', async () => {
    const wrapper = createComponent(validOrgData, NaN, null)

    expect(wrapper.find(removeButtonSelector).attributes('disabled')).toBeDefined()

    wrapper.destroy()
  })

  it('Emits "remove" event when clicking Remove button', async () => {
    const wrapper = createComponent(validOrgData, 0, null)

    wrapper.find(removeButtonSelector).trigger('click')
    await Vue.nextTick()

    expect(getLastEvent(wrapper, removeEvent)).toBe(0)

    wrapper.destroy()
  })

  it('Emits "reset" event when clicking Done button and org has not changed', async () => {
    const wrapper = createComponent(validOrgData, 0, null)
    await Vue.nextTick()

    // verify that button is not disabled, then click it
    const button = wrapper.find(doneButtonSelector)
    expect(button.attributes('disabled')).toBeUndefined()
    button.trigger('click')
    await Vue.nextTick()

    const emitted = wrapper.emitted(resetEvent)
    expect(emitted.length).toBe(1)
    expect(emitted[0]).toStrictEqual([]) // empty event

    wrapper.destroy()
  })

  it('Emits "addEdit" event when clicking Done button and org has changed', async () => {
    const wrapper = createComponent(validOrgData, 0, null)
    await Vue.nextTick()

    // change org name
    const input = wrapper.find(orgNameSelector)
    input.setValue('Different Test Org')
    input.trigger('change')
    await Vue.nextTick()

    // verify that button is not disabled, then click it
    const button = wrapper.find(doneButtonSelector)
    expect(button.attributes('disabled')).toBeUndefined()
    button.trigger('click')
    await Vue.nextTick()

    expect(getLastEvent(wrapper, addEditEvent).officer.organizationName).toBe('Different Test Org')

    wrapper.destroy()
  })

  it('Emits "reset" event when clicking Cancel button', async () => {
    const wrapper = createComponent(validOrgData, 0, null)
    wrapper.vm.applyValidation()
    await Vue.nextTick()

    wrapper.find(cancelButtonSelector).trigger('click')
    await Vue.nextTick()

    const emitted = wrapper.emitted(resetEvent)
    expect(emitted.length).toBe(1)
    expect(emitted[0]).toStrictEqual([]) // empty event

    wrapper.destroy()
  })

  it('Does not display error message when user enters valid org name', async () => {
    const wrapper = createComponent(validOrgData, NaN, null)

    const input = wrapper.find(orgNameSelector)
    input.setValue('Valid Org Name')
    input.trigger('change')
    await flushPromises()

    expect(wrapper.find(orgPersonFormSelector).text()).not.toContain('Invalid spaces')
    expect(wrapper.vm.$data.orgPersonFormValid).toBe(true)

    wrapper.destroy()
  })

  it('Displays error message when user enters invalid org name', async () => {
    const wrapper = createComponent(validOrgData, NaN, null)
    wrapper.vm.applyValidation()
    await Vue.nextTick()

    const input = wrapper.find(orgNameSelector)
    input.setValue(' Invalid Org Name ')
    input.trigger('change')
    await flushPromises()

    expect(wrapper.find(orgPersonFormSelector).text()).toContain('Invalid spaces')
    expect(wrapper.vm.$data.orgPersonFormValid).toBe(false)

    wrapper.destroy()
  })

  it('Does not display error message when user enters valid person names', async () => {
    const wrapper = createComponent(validPersonData, NaN, null)

    const input1 = wrapper.find(firstNameSelector)
    input1.setValue('First')
    input1.trigger('change')

    const input2 = wrapper.find(middleNameSelector)
    input2.setValue('Middle')
    input2.trigger('change')

    const input3 = wrapper.find(lastNameSelector)
    input3.setValue('Last')
    input3.trigger('change')
    await flushPromises()

    expect(wrapper.findAll('.v-messages__message').length).toBe(0)
    expect(wrapper.vm.$data.orgPersonFormValid).toBe(true)

    wrapper.destroy()
  })

  it('Displays error message when user does not enter person names', async () => {
    const wrapper = createComponent(validPersonData, NaN, null)
    wrapper.vm.applyValidation()
    await Vue.nextTick()

    const input1 = wrapper.find(firstNameSelector)
    input1.setValue('')
    input1.trigger('change')

    const input2 = wrapper.find(middleNameSelector)
    input2.setValue('')
    input2.trigger('change')

    const input3 = wrapper.find(lastNameSelector)
    input3.setValue('')
    input3.trigger('change')
    await flushPromises()

    const messages = wrapper.findAll('.v-messages__message')
    expect(messages.length).toBe(2)
    expect(messages.at(0).text()).toBe('A first name is required')
    expect(messages.at(1).text()).toBe('A last name is required')
    expect(wrapper.vm.$data.orgPersonFormValid).toBe(false)

    wrapper.destroy()
  })

  it('Displays error message when user enters person names that are too long', async () => {
    const wrapper = createComponent(validPersonData, NaN, null)
    wrapper.vm.applyValidation()
    await Vue.nextTick()

    const input1 = wrapper.find(firstNameSelector)
    input1.setValue('1234567890123456789012345678901')
    input1.trigger('change')

    const input2 = wrapper.find(middleNameSelector)
    input2.setValue('1234567890123456789012345678901')
    input2.trigger('change')

    const input3 = wrapper.find(lastNameSelector)
    input3.setValue('1234567890123456789012345678901')
    input3.trigger('change')
    await Vue.nextTick()
    await flushPromises()
    await Vue.nextTick()

    const messages = wrapper.findAll('.v-messages__message')
    expect(messages.length).toBe(3)
    expect(messages.at(0).text()).toBe('Cannot exceed 30 characters')
    expect(messages.at(1).text()).toBe('Cannot exceed 30 characters')
    expect(messages.at(2).text()).toBe('Cannot exceed 30 characters')
    expect(wrapper.vm.$data.orgPersonFormValid).toBe(false)

    wrapper.destroy()
  })

  it('Shows popup if there is an existing completing party', async () => {
    const wrapper = createComponent(validIncorporator, NaN, validPersonData)

    // verify that popup is not yet displayed
    expect(wrapper.find('.confirm-dialog').exists()).toBe(false)

    // check the Completing Party box
    const checkbox = wrapper.find(completingPartyChkBoxSelector)
    checkbox.setChecked(true)
    await Vue.nextTick()

    // verify that popup is now displayed
    expect(wrapper.find('.confirm-dialog').exists()).toBe(true)

    wrapper.destroy()
  })

  it('Emits "removeCpRole" and "addEdit" events on reassigning the Completing Party', async () => {
    const wrapper = createComponent(validIncorporator, NaN, validPersonData)

    // add Completing Party role
    const checkbox = wrapper.find(completingPartyChkBoxSelector)
    checkbox.setChecked(true)
    await Vue.nextTick()

    // verify and accept reassign dialog
    const reassignDialog = wrapper.vm.$refs.reassignCpDialog as any
    expect(reassignDialog).toBeTruthy()
    await reassignDialog.onClickYes()
    await flushPromises()

    // verify flag
    expect(wrapper.vm.$data.reassignCompletingParty).toBe(true)

    // click the Done button
    wrapper.find(doneButtonSelector).trigger('click')
    await Vue.nextTick()

    expect(wrapper.emitted(removeCpRoleEvent).length).toBe(1)
    expect(wrapper.emitted(removeCpRoleEvent)[0]).toStrictEqual([]) // empty event

    expect(getLastEvent(wrapper, addEditEvent).roles[0])
      .toStrictEqual({ roleType: 'Completing Party', appointmentDate: '2020-03-30' })

    wrapper.destroy()
  })

  it('Displays errors and does not submit form when clicking Done button and form is invalid', async () => {
    const wrapper = createComponent(emptyPerson, NaN, null)
    wrapper.vm.applyValidation()
    await Vue.nextTick()

    // verify that Done button is enabled, even for an empty person
    // then click it
    const button = wrapper.find(doneButtonSelector)
    expect(button.attributes('disabled')).toBeUndefined()
    button.trigger('click')
    await Vue.nextTick()

    // get a list of validation messages
    const wrappers = wrapper.findAll('.v-messages__message')
    const messages: Array<string> = []
    for (let i = 0; i < wrappers.length; i++) {
      messages.push(wrappers.at(i).text())
    }

    // verify some error messages
    expect(messages.includes('A first name is required'))
    expect(messages.includes('A last name is required'))
    expect(messages.includes('A role is required'))
    expect(messages.includes('This field is required'))

    // verify that no events were emitted
    expect(wrapper.emitted(removeCpRoleEvent)).toBeUndefined()
    expect(wrapper.emitted(addEditEvent)).toBeUndefined()
    expect(wrapper.emitted(resetEvent)).toBeUndefined()

    wrapper.destroy()
  })
})
