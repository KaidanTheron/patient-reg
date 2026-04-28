I have chosen to use claude sonnet and opus in cursor (with cursor tab disabled, that's just annoying) as opposed to other frontier models because I find claude to be a lot less sycophantic compared to, say, chatgpt.

I used claude opus in plan mode, where I assessed whether its goal and solutions are aligned with what the problem demands. If there were misaligments I would tell it to not do some specific things that it thought it had to do and refine the plan. However, there were few misalignments because I stuck to smaller problem sizes and allow my own modifications to steer the model in the right direction. 
After I'm happy with the plan, I would build the spec-ed solution using sonnet to keep costs low.

The areas where I preferred using the models were:
- generating jsdoc annotations for readability
- generating graphql models
- generating tests, since a review of test coverage and implementation allows for much faster throughput than writing them manually.
- generating the frontend; it is not as heavy logic heavy as the backend and prone to slop breaking down the domain's stability

Below is a chat snippet with claude sonnet for putting together the frontend
---
## Me:

I have the frontend setup fresh with react query and graphql codegen setup pointing to my graphql backend.
I want a clean readable codebase that implements the following workflows.

Practice:
entrypoint -> show all available practices and select one, set the practice id as a cookie to be used for practice facing session graphql calls.
Once the user is acting as a "staff member" of one of the practices I want them to follow the workflow described in docs/design.md for inititating and reviewing registration. When a practice views which registration requests they have they just see the associated patient's details and the status of that registration request.

Patient:
Will follow the workflow 
entrypoint -> register url, the format of which can be found in the backend.
Each time the register url is loaded perform a server side check against the graphql api to check if the link is valid, if it is not valid show something like a simple "oops this link is not valid. Please contact one of your PatientReg registered practices to send you a new registration link".
If the link is valid show them ui to populate their id and verify their identity via button press.
If their verification fails inform them appropriately based on the verification output and show them how many attempts are left before this link is revoked if it applies.
If their verification passes then you can gray out the id input as it cannot be edited anymore, move it to the top of the screen and just keep the id in state (do NOT store it anywhere like session storage or local storage), and show them their registration requests.
Once they select a registration request (each registration request showing the associated practice's name and the request status), they are shown some more information about the registration request and can fill in the registration document. Use the available graphql patient session facing queries for deriving date of birth, gender and getting patient information to prefill the registration document.

Donts:
- Don't show uuids in the ui. They are safe, but make the UI noisy.
- At no point should a patient be navigated to a new url, all navigation for a patient should be client side and act as an SPA. This rule does not apply to practice staff users.
Dos:
- extract reusable components
- extract helpers
- extract graphql server side executes and client side react query calls into their own domain.  The react query calls should use the server side predefined executes under the hood.

Please interview me until you are sure you have all the information you need to build this patient and practice workflow.

## Claude:
Before I implement, I need a few specifics so the frontend matches your backend and intended UX.

Backend/API

1. What is the GraphQL backend URL for local development?
2. Is GraphQL Codegen already generating typed documents/hooks, or should I add/adjust operations and rerun codegen?
3. Where should I find the backend route format for the patient registration URL? Is the backend repo available in this workspace or elsewhere?
4. What auth/session mechanism does the GraphQL backend expect for:
    - practice-facing calls after setting the practice id cookie?
    - patient-facing calls after validating/verifying a registration link?

Practice Workflow
5. In docs/design.md, should I implement the whole described practice workflow, or only:
- select practice
- initiate registration
- list/review registration requests?
- When selecting a practice, should the practice id cookie be:
- session-only, or persistent?
- named something specific?
- scoped/path-specific?

For “initiate registration”, what fields should staff enter before sending/creating a registration request?
Should practice staff be able to approve/reject/mark reviewed registrations, or only view them?
Patient Workflow
9. What exact patient verification input is required: national ID only, or ID plus date of birth/phone/etc.?
10. What are the possible verification failure outputs from GraphQL, and how should each be phrased to the patient?
11. After verification succeeds, should the patient session be represented only by in-memory React state plus the registration link token, or does the backend return a temporary session token/cookie?
12. Can a verified patient fill multiple registration requests in one visit, or should submission complete/end the flow?

Registration Document
13. What fields must be included in the registration document?
14. Which fields should be prefilled from GraphQL patient information?
15. Are date of birth and gender read-only derived fields, or editable?
16. What happens on submit: save draft, submit final, or both?
17. Are there validation rules I should mirror client-side?

UI/Routes
18. Do you have preferred frontend routes? For example:

/ practice selection
/practice/registrations
/practice/registrations/new
/register/:token
19. Should practice staff navigation use React Router, file-based routing, or whatever is already in the app?
20. Any design system/component library already installed that I should use?
Once I have these, I can inspect the repo and build the workflows cleanly around the existing GraphQL/codegen setup.

## Me:

1. It is defined in env; localhost:3000
2. Graphql codegen --watch is running and should automatically and generate types for changes made
3. The backend repo is available in this workspace, you will find the format under registration link formatter under domain.
4. practice facing calls simply expect a practice id as a bearer token, patient facing session calls expect the returned jwt token from verification to be used a bearer token
5. implement the whole described workflow following the other constraints I already gave you
6. it can be persistent, named practice_session, it doesn't have to be scoped to any specific path
7. Just staff id and patient identity number, as required by the graphql mutation
8. the process of reviewing registration requests entails viewing a field level diff of the current patient record vs the registration document for the registration request. they can then reject (with a reason) or approve. 
9. south african id only, but you don't need to do any validation further than ensuring it is a string of numbers, the backend will do that.
10. You can inspect the backend verify registration code for that
11. The backend will return a token upon succesful verification which can be set as a cookie and sent as a bearer token for patient facing session calls.
12. They can fill multiple registration requests in one visit by just "navigating" back to their inbox of registration requests
13. All the required registration document fields for the graphql mutation for submitting a registration document
14. everything that is available from deriving date of birth, deriving gender and fetching the authed patient's profile
15. they are editable, everything that is prefilled can be edited, they just act as UX enhances for not having to fill in data that is already up to date.
16. there is not submit variations, there is only a final submit which will immediately mark the registration request as in review (the backend handles this).
17. You can rely on the backend for validation for the sake of keeping things simple
18. the routes you have mentioned are perfect for use in this case
19. react router, which is already in the app, this is a react router 7 based application
20. there is no component library already installed.

---

In the above run claue insisted on using its own implementation for cookies, which did not work at all, at which point I had to step in and tell it to use the react router 7 idiomatic solution for cookie session store. After this update the solution was stable.
Clause also seems to enjoy righting massive, ugly ternary chains, which work at the end of the day, but are not readable and make it hard to keep track of the problem being solved and the solution. I had to steer it clear from doing this a couple of times.

Additionally, in my model for the system, the patient record would only be updated after approval of their registration document, and the "external" table `patient-identity`. It would misunderstand the data flow sometimes and attempt to modify the patient record outside of document approval sometimes, and occasionally, while not explicitly using them, it would implement interface methods for writing to the `patient-identity` table which is strictly not allowed so those methods shouldn't exist in the first place. 

You'll also notice the absence of a CLAUDE.md, I find that these context files tend to distract the model a lot and running the model raw and allowing it instead to gather context based on the problem at hand yields better results.