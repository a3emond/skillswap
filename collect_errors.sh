#!/usr/bin/env bash

set -u

BASE="https://stingray-app-wxhhn.ondigitalocean.app"
PASSWORD="Password123!"
TS=$(date +%s)

CLIENT_EMAIL="client_${TS}@mail.com"
CLIENT_USER="client_${TS}"
CLIENT_NAME="Client ${TS}"

FREELANCER_EMAIL="freelancer_${TS}@mail.com"
FREELANCER_USER="freelancer_${TS}"
FREELANCER_NAME="Freelancer ${TS}"

CLIENT_BIO="Client test bio"
FREELANCER_BIO="Freelancer test bio"

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required"
    exit 1
  fi
}

print_section() {
  echo
  echo "================================="
  echo "$1"
  echo "================================="
}

print_case() {
  echo
  echo "--- $1 ---"
}

json_post() {
  local url="$1"
  local body="$2"

  curl -s -X POST "$url" \
    -H "Content-Type: application/json" \
    -d "$body"
}

json_patch() {
  local url="$1"
  local body="${2:-{}}"
  local token="${3:-}"

  if [ -n "$token" ]; then
    curl -s -X PATCH "$url" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -s -X PATCH "$url" \
      -H "Content-Type: application/json" \
      -d "$body"
  fi
}

json_get() {
  local url="$1"
  local token="${2:-}"

  if [ -n "$token" ]; then
    curl -s "$url" -H "Authorization: Bearer $token"
  else
    curl -s "$url"
  fi
}

json_delete() {
  local url="$1"
  local token="${2:-}"

  if [ -n "$token" ]; then
    curl -s -X DELETE "$url" -H "Authorization: Bearer $token"
  else
    curl -s -X DELETE "$url"
  fi
}

extract_token() {
  echo "$1" | jq -r '.token // empty'
}

extract_id() {
  echo "$1" | jq -r '.id // empty'
}

extract_user_id() {
  echo "$1" | jq -r '.user.id // .id // empty'
}

assert_no_error() {
  local response="$1"
  local label="$2"

  if echo "$response" | jq -e '.error' >/dev/null 2>&1; then
    echo "Setup failed at: $label"
    echo "$response"
    exit 1
  fi
}

require_jq

print_section "REGISTER USERS"

CLIENT_REGISTER=$(json_post "$BASE/auth/register" "{
  \"name\": \"$CLIENT_NAME\",
  \"username\": \"$CLIENT_USER\",
  \"email\": \"$CLIENT_EMAIL\",
  \"password\": \"$PASSWORD\",
  \"bio\": \"$CLIENT_BIO\",
  \"skills\": [\"client\", \"testing\"]
}")
echo "$CLIENT_REGISTER"
assert_no_error "$CLIENT_REGISTER" "client register"

FREELANCER_REGISTER=$(json_post "$BASE/auth/register" "{
  \"name\": \"$FREELANCER_NAME\",
  \"username\": \"$FREELANCER_USER\",
  \"email\": \"$FREELANCER_EMAIL\",
  \"password\": \"$PASSWORD\",
  \"bio\": \"$FREELANCER_BIO\",
  \"skills\": [\"angular\", \"frontend\"]
}")
echo "$FREELANCER_REGISTER"
assert_no_error "$FREELANCER_REGISTER" "freelancer register"

CLIENT_ID=$(extract_user_id "$CLIENT_REGISTER")
FREELANCER_ID=$(extract_user_id "$FREELANCER_REGISTER")

print_section "LOGIN USERS"

CLIENT_LOGIN=$(json_post "$BASE/auth/login" "{
  \"email\": \"$CLIENT_EMAIL\",
  \"password\": \"$PASSWORD\"
}")
echo "$CLIENT_LOGIN"
assert_no_error "$CLIENT_LOGIN" "client login"

FREELANCER_LOGIN=$(json_post "$BASE/auth/login" "{
  \"email\": \"$FREELANCER_EMAIL\",
  \"password\": \"$PASSWORD\"
}")
echo "$FREELANCER_LOGIN"
assert_no_error "$FREELANCER_LOGIN" "freelancer login"

CLIENT_TOKEN=$(extract_token "$CLIENT_LOGIN")
FREELANCER_TOKEN=$(extract_token "$FREELANCER_LOGIN")

if [ -z "$CLIENT_TOKEN" ] || [ "$CLIENT_TOKEN" = "null" ]; then
  echo "Client token not found"
  exit 1
fi

if [ -z "$FREELANCER_TOKEN" ] || [ "$FREELANCER_TOKEN" = "null" ]; then
  echo "Freelancer token not found"
  exit 1
fi

echo "CLIENT TOKEN OK"
echo "FREELANCER TOKEN OK"
echo "CLIENT_ID=$CLIENT_ID"
echo "FREELANCER_ID=$FREELANCER_ID"

print_section "AUTH ERROR TESTS"

print_case "Login missing fields"
json_post "$BASE/auth/login" '{}'
echo

print_case "Login invalid credentials"
json_post "$BASE/auth/login" '{"email":"fake@mail.com","password":"wrong"}'
echo

print_case "Register missing fields"
json_post "$BASE/auth/register" '{}'
echo

print_case "Register invalid username"
json_post "$BASE/auth/register" "{
  \"name\": \"Bad User\",
  \"username\": \"??\",
  \"email\": \"bad_${TS}@mail.com\",
  \"password\": \"$PASSWORD\",
  \"bio\": \"bad\",
  \"skills\": [\"x\"]
}"
echo

print_case "Register email already used"
json_post "$BASE/auth/register" "{
  \"name\": \"Dup Email\",
  \"username\": \"duplicate_${TS}\",
  \"email\": \"$CLIENT_EMAIL\",
  \"password\": \"$PASSWORD\",
  \"bio\": \"dup\",
  \"skills\": [\"x\"]
}"
echo

print_case "Register username already used"
json_post "$BASE/auth/register" "{
  \"name\": \"Dup Username\",
  \"username\": \"$CLIENT_USER\",
  \"email\": \"dup_${TS}@mail.com\",
  \"password\": \"$PASSWORD\",
  \"bio\": \"dup\",
  \"skills\": [\"x\"]
}"
echo

print_section "USERS ERROR TESTS"

print_case "GET /users/me without token"
json_get "$BASE/users/me"
echo

print_case "GET /users/me invalid token"
json_get "$BASE/users/me" "invalidtoken"
echo

print_case "GET unknown user"
json_get "$BASE/users/unknown_user_123"
echo

print_section "CREATE JOBS"

OPEN_JOB=$(json_post "$BASE/jobs" "{
  \"title\": \"Open Test Job $TS\",
  \"description\": \"Open job for proposal tests\",
  \"budget\": 100,
  \"category\": \"test\"
}" | sed 's/^//')
OPEN_JOB=$(curl -s -X POST "$BASE/jobs" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Open Test Job $TS\",
    \"description\": \"Open job for proposal tests\",
    \"budget\": 100,
    \"category\": \"test\"
  }")
echo "$OPEN_JOB"
assert_no_error "$OPEN_JOB" "open job creation"
OPEN_JOB_ID=$(extract_id "$OPEN_JOB")

COMPLETABLE_JOB=$(curl -s -X POST "$BASE/jobs" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Completable Job $TS\",
    \"description\": \"Job for completion and review tests\",
    \"budget\": 200,
    \"category\": \"test\"
  }")
echo "$COMPLETABLE_JOB"
assert_no_error "$COMPLETABLE_JOB" "completable job creation"
COMPLETABLE_JOB_ID=$(extract_id "$COMPLETABLE_JOB")

echo "OPEN_JOB_ID=$OPEN_JOB_ID"
echo "COMPLETABLE_JOB_ID=$COMPLETABLE_JOB_ID"

print_section "JOBS ERROR TESTS"

print_case "Search invalid budget"
json_post "$BASE/jobs/search" '{"min_budget":"abc"}'
echo

print_case "Create job without token"
json_post "$BASE/jobs" '{
  "title":"a",
  "description":"b",
  "budget":10,
  "category":"test"
}'
echo

print_case "Get job without token"
json_get "$BASE/jobs/$OPEN_JOB_ID"
echo

print_case "Get job invalid token"
json_get "$BASE/jobs/$OPEN_JOB_ID" "invalidtoken"
echo

print_case "Get job not found"
json_get "$BASE/jobs/999999999" "$CLIENT_TOKEN"
echo

print_case "Update job empty payload"
json_patch "$BASE/jobs/$OPEN_JOB_ID" '{}' "$CLIENT_TOKEN"
echo

print_case "Update job invalid status"
json_patch "$BASE/jobs/$OPEN_JOB_ID" '{"status":"invalid"}' "$CLIENT_TOKEN"
echo

print_case "Update job forbidden"
json_patch "$BASE/jobs/$OPEN_JOB_ID" '{"title":"forbidden edit"}' "$FREELANCER_TOKEN"
echo

print_case "Complete job not in progress"
json_patch "$BASE/jobs/$OPEN_JOB_ID/complete" '{}' "$CLIENT_TOKEN"
echo

print_section "PROPOSALS TESTS"

print_case "Submit proposal missing fields"
json_post "$BASE/jobs/$OPEN_JOB_ID/proposals" '{}' >/dev/null 2>&1
curl -s -X POST "$BASE/jobs/$OPEN_JOB_ID/proposals" \
  -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
echo

print_case "Submit proposal to own job"
curl -s -X POST "$BASE/jobs/$OPEN_JOB_ID/proposals" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price":10,"cover_letter":"hello"}'
echo

print_case "Submit valid proposal on open job"
OPEN_PROPOSAL=$(curl -s -X POST "$BASE/jobs/$OPEN_JOB_ID/proposals" \
  -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price":100,"cover_letter":"proposal"}')
echo "$OPEN_PROPOSAL"
assert_no_error "$OPEN_PROPOSAL" "open proposal creation"
OPEN_PROPOSAL_ID=$(extract_id "$OPEN_PROPOSAL")

print_case "Submit duplicate pending proposal"
curl -s -X POST "$BASE/jobs/$OPEN_JOB_ID/proposals" \
  -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price":100,"cover_letter":"proposal"}'
echo

print_case "Get proposals forbidden"
json_get "$BASE/jobs/$OPEN_JOB_ID/proposals" "$FREELANCER_TOKEN"
echo

print_case "Get proposals valid as owner"
json_get "$BASE/jobs/$OPEN_JOB_ID/proposals" "$CLIENT_TOKEN"
echo

print_case "Accept proposal forbidden as freelancer"
json_patch "$BASE/proposals/$OPEN_PROPOSAL_ID/accept" '{}' "$FREELANCER_TOKEN"
echo

print_case "Accept valid proposal as owner"
json_patch "$BASE/proposals/$OPEN_PROPOSAL_ID/accept" '{}' "$CLIENT_TOKEN"
echo

print_case "Delete proposal not pending"
json_delete "$BASE/proposals/$OPEN_PROPOSAL_ID" "$FREELANCER_TOKEN"
echo

print_case "Submit proposal on closed job"
curl -s -X POST "$BASE/jobs/$OPEN_JOB_ID/proposals" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price":10,"cover_letter":"hello"}' >/dev/null 2>&1

curl -s -X POST "$BASE/jobs/$OPEN_JOB_ID/proposals" \
  -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price":120,"cover_letter":"closed job try"}'
echo

print_case "Accept proposal not found"
json_patch "$BASE/proposals/999999999/accept" '{}' "$CLIENT_TOKEN"
echo

print_case "Delete proposal not found"
json_delete "$BASE/proposals/999999999" "$FREELANCER_TOKEN"
echo

print_section "SETUP IN_PROGRESS JOB FOR REVIEW TESTS"

REVIEW_PROPOSAL=$(curl -s -X POST "$BASE/jobs/$COMPLETABLE_JOB_ID/proposals" \
  -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price":180,"cover_letter":"review flow proposal"}')
echo "$REVIEW_PROPOSAL"
assert_no_error "$REVIEW_PROPOSAL" "review proposal creation"
REVIEW_PROPOSAL_ID=$(extract_id "$REVIEW_PROPOSAL")

ACCEPT_REVIEW_PROPOSAL=$(json_patch "$BASE/proposals/$REVIEW_PROPOSAL_ID/accept" '{}' "$CLIENT_TOKEN")
echo "$ACCEPT_REVIEW_PROPOSAL"
assert_no_error "$ACCEPT_REVIEW_PROPOSAL" "review proposal accept"

print_section "REVIEWS TESTS"

print_case "Review invalid rating"
curl -s -X POST "$BASE/jobs/$COMPLETABLE_JOB_ID/reviews" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"target_id\":$FREELANCER_ID,\"rating\":10}"
echo

print_case "Review self"
curl -s -X POST "$BASE/jobs/$COMPLETABLE_JOB_ID/reviews" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"target_id\":$CLIENT_ID,\"rating\":5}"
echo

print_case "Review missing fields"
curl -s -X POST "$BASE/jobs/$COMPLETABLE_JOB_ID/reviews" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
echo

print_case "Review job not completed"
curl -s -X POST "$BASE/jobs/$COMPLETABLE_JOB_ID/reviews" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"target_id\":$FREELANCER_ID,\"rating\":5}"
echo

print_case "Complete job valid"
json_patch "$BASE/jobs/$COMPLETABLE_JOB_ID/complete" '{}' "$CLIENT_TOKEN"
echo

print_case "Review target user not found"
curl -s -X POST "$BASE/jobs/$COMPLETABLE_JOB_ID/reviews" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target_id":999999999,"rating":5}'
echo

print_case "Review target must be the other participant"
curl -s -X POST "$BASE/jobs/$COMPLETABLE_JOB_ID/reviews" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target_id":123456789,"rating":5}'
echo

print_case "Review valid by client"
VALID_REVIEW=$(curl -s -X POST "$BASE/jobs/$COMPLETABLE_JOB_ID/reviews" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"target_id\":$FREELANCER_ID,\"rating\":5}")
echo "$VALID_REVIEW"

print_case "Review duplicate by client"
curl -s -X POST "$BASE/jobs/$COMPLETABLE_JOB_ID/reviews" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"target_id\":$FREELANCER_ID,\"rating\":5}"
echo

print_case "Review valid by freelancer"
curl -s -X POST "$BASE/jobs/$COMPLETABLE_JOB_ID/reviews" \
  -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"target_id\":$CLIENT_ID,\"rating\":4}"
echo

print_case "Get reviews unknown user"
json_get "$BASE/reviews/user/999999999"
echo

print_case "Get reviews invalid user id"
json_get "$BASE/reviews/user/abc"
echo

print_section "PLATFORM STATS"

json_get "$BASE/platform/stats"
echo

print_section "DONE"