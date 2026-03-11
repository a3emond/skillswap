#!/usr/bin/env bash
set -euo pipefail

BASE="https://stingray-app-wxhhn.ondigitalocean.app"
PASSWORD="Password123!"
TS=$(date +%s)

CLIENT_EMAIL="client_${TS}@mail.com"
CLIENT_USER="client_${TS}"
CLIENT_NAME="Client ${TS}"

FREELANCER_EMAIL="freelancer_${TS}@mail.com"
FREELANCER_USER="freelancer_${TS}"
FREELANCER_NAME="Freelancer ${TS}"

THIRD_EMAIL="third_${TS}@mail.com"
THIRD_USER="third_${TS}"
THIRD_NAME="Third ${TS}"

CLIENT_BIO="Client test bio"
FREELANCER_BIO="Freelancer test bio"
THIRD_BIO="Third test bio"

LOG="errors.ndjson"
CAT="error_catalog.json"
> "$LOG"

require() {
command -v curl >/dev/null || { echo "curl missing"; exit 1; }
command -v jq >/dev/null || { echo "jq missing"; exit 1; }
command -v mktemp >/dev/null || { echo "mktemp missing"; exit 1; }
}

request() {
method="$1"
endpoint="$2"
body="${3:-}"
token="${4:-}"

tmp=$(mktemp)

if [ -n "$token" ]; then
status=$(curl -s -o "$tmp" -w "%{http_code}" -X "$method" "$BASE$endpoint" -H "Authorization: Bearer $token" -H "Content-Type: application/json" ${body:+--data "$body"})
else
status=$(curl -s -o "$tmp" -w "%{http_code}" -X "$method" "$BASE$endpoint" -H "Content-Type: application/json" ${body:+--data "$body"})
fi

raw=$(cat "$tmp")
rm "$tmp"

jq -n \
--arg m "$method" \
--arg e "$endpoint" \
--arg b "$body" \
--arg r "$raw" \
--arg s "$status" \
'{
method:$m,
endpoint:$e,
request_body:$b,
status:($s|tonumber),
raw:$r,
json:(try ($r|fromjson) catch null),
error:(try (($r|fromjson).error) catch null),
suggested_username:(try (($r|fromjson).suggested_username) catch null)
}'
}

record() {
module="$1"
case="$2"
method="$3"
endpoint="$4"
body="${5:-}"
token="${6:-}"

res=$(request "$method" "$endpoint" "$body" "$token")

jq -n \
--arg module "$module" \
--arg case "$case" \
--argjson r "$res" \
'{
module:$module,
case:$case,
method:$r.method,
endpoint:$r.endpoint,
status:$r.status,
error:$r.error,
suggested_username:$r.suggested_username
}' >> "$LOG"

echo "$res" | jq
}

uid() {
echo "$1" | jq -r '.json.user.id // .json.id // empty'
}

token() {
echo "$1" | jq -r '.json.token // empty'
}

jid() {
echo "$1" | jq -r '.json.job_id // empty'
}

pid() {
echo "$1" | jq -r '.json.proposal_id // empty'
}

require

echo "REGISTER USERS"

A=$(request POST /auth/register "{\"name\":\"$CLIENT_NAME\",\"username\":\"$CLIENT_USER\",\"email\":\"$CLIENT_EMAIL\",\"password\":\"$PASSWORD\",\"bio\":\"$CLIENT_BIO\",\"skills\":[\"client\"]}")
echo "$A" | jq
CLIENT_ID=$(uid "$A")

B=$(request POST /auth/register "{\"name\":\"$FREELANCER_NAME\",\"username\":\"$FREELANCER_USER\",\"email\":\"$FREELANCER_EMAIL\",\"password\":\"$PASSWORD\",\"bio\":\"$FREELANCER_BIO\",\"skills\":[\"angular\"]}")
echo "$B" | jq
FREELANCER_ID=$(uid "$B")

C=$(request POST /auth/register "{\"name\":\"$THIRD_NAME\",\"username\":\"$THIRD_USER\",\"email\":\"$THIRD_EMAIL\",\"password\":\"$PASSWORD\",\"bio\":\"$THIRD_BIO\",\"skills\":[\"x\"]}")
echo "$C" | jq
THIRD_ID=$(uid "$C")

echo "LOGIN USERS"

L1=$(request POST /auth/login "{\"email\":\"$CLIENT_EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$L1" | jq
CLIENT_TOKEN=$(token "$L1")

L2=$(request POST /auth/login "{\"email\":\"$FREELANCER_EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$L2" | jq
FREELANCER_TOKEN=$(token "$L2")

L3=$(request POST /auth/login "{\"email\":\"$THIRD_EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$L3" | jq
THIRD_TOKEN=$(token "$L3")

echo "AUTH ERRORS"

record auth login_missing POST /auth/login '{}'
record auth login_bad POST /auth/login '{"email":"a","password":"b"}'
record auth register_missing POST /auth/register '{}'
record auth register_invalid POST /auth/register "{\"name\":\"x\",\"username\":\"??\",\"email\":\"bad${TS}@mail.com\",\"password\":\"$PASSWORD\",\"bio\":\"x\",\"skills\":[\"x\"]}"
record auth email_duplicate POST /auth/register "{\"name\":\"x\",\"username\":\"dup${TS}\",\"email\":\"$CLIENT_EMAIL\",\"password\":\"$PASSWORD\",\"bio\":\"x\",\"skills\":[\"x\"]}"
record auth username_duplicate POST /auth/register "{\"name\":\"x\",\"username\":\"$CLIENT_USER\",\"email\":\"dup${TS}@mail.com\",\"password\":\"$PASSWORD\",\"bio\":\"x\",\"skills\":[\"x\"]}"

echo "USER ERRORS"

record users me_no_token GET /users/me
record users me_invalid_token GET /users/me "" "invalidtoken"
record users not_found GET /users/unknown

echo "CREATE JOBS"

J1=$(request POST /jobs "{\"title\":\"job$TS\",\"description\":\"x\",\"budget\":100,\"category\":\"test\"}" "$CLIENT_TOKEN")
echo "$J1" | jq
JOB_OPEN=$(jid "$J1")

J2=$(request POST /jobs "{\"title\":\"job2$TS\",\"description\":\"x\",\"budget\":200,\"category\":\"test\"}" "$CLIENT_TOKEN")
echo "$J2" | jq
JOB_REVIEW=$(jid "$J2")

echo "JOB ERRORS"

record jobs search_budget POST /jobs/search '{"min_budget":"abc"}'
record jobs create_no_token POST /jobs '{"title":"x","description":"x","budget":1,"category":"t"}'
record jobs create_missing POST /jobs '{}' "$CLIENT_TOKEN"
record jobs get_no_token GET "/jobs/$JOB_OPEN"
record jobs get_invalid GET "/jobs/$JOB_OPEN" "" "invalidtoken"
record jobs get_missing GET /jobs/999999 "" "$CLIENT_TOKEN"
record jobs update_invalid PATCH "/jobs/$JOB_OPEN" '{"status":"bad"}' "$CLIENT_TOKEN"
record jobs update_empty PATCH "/jobs/$JOB_OPEN" '{}' "$CLIENT_TOKEN"
record jobs update_forbidden PATCH "/jobs/$JOB_OPEN" '{"title":"x"}' "$FREELANCER_TOKEN"
record jobs complete_not_progress PATCH "/jobs/$JOB_OPEN/complete" '{}' "$CLIENT_TOKEN"

echo "PROPOSALS"

record prop missing POST "/jobs/$JOB_OPEN/proposals" '{}' "$FREELANCER_TOKEN"
record prop own POST "/jobs/$JOB_OPEN/proposals" '{"price":10,"cover_letter":"x"}' "$CLIENT_TOKEN"
record prop job_missing POST /jobs/999999/proposals '{"price":1,"cover_letter":"x"}' "$FREELANCER_TOKEN"

P=$(request POST "/jobs/$JOB_OPEN/proposals" '{"price":50,"cover_letter":"ok"}' "$FREELANCER_TOKEN")
echo "$P" | jq
PROPOSAL=$(pid "$P")

record prop duplicate POST "/jobs/$JOB_OPEN/proposals" '{"price":50,"cover_letter":"ok"}' "$FREELANCER_TOKEN"
record prop get_forbidden GET "/jobs/$JOB_OPEN/proposals" "" "$FREELANCER_TOKEN"
record prop accept_forbidden PATCH "/proposals/$PROPOSAL/accept" '{}' "$FREELANCER_TOKEN"

A=$(request PATCH "/proposals/$PROPOSAL/accept" '{}' "$CLIENT_TOKEN")
echo "$A" | jq

record prop delete_not_pending DELETE "/proposals/$PROPOSAL" "" "$FREELANCER_TOKEN"
record prop accept_missing PATCH /proposals/999999/accept '{}' "$CLIENT_TOKEN"
record prop delete_missing DELETE /proposals/999999 "" "$FREELANCER_TOKEN"

echo "SETUP REVIEW"

PR=$(request POST "/jobs/$JOB_REVIEW/proposals" '{"price":120,"cover_letter":"r"}' "$FREELANCER_TOKEN")
echo "$PR" | jq
PRID=$(pid "$PR")

request PATCH "/proposals/$PRID/accept" '{}' "$CLIENT_TOKEN" >/dev/null

echo "REVIEWS"

record rev bad_rating POST "/jobs/$JOB_REVIEW/reviews" "{\"target_id\":$FREELANCER_ID,\"rating\":10}" "$CLIENT_TOKEN"
record rev self POST "/jobs/$JOB_REVIEW/reviews" "{\"target_id\":$CLIENT_ID,\"rating\":5}" "$CLIENT_TOKEN"
record rev missing POST "/jobs/$JOB_REVIEW/reviews" '{}' "$CLIENT_TOKEN"
record rev not_completed POST "/jobs/$JOB_REVIEW/reviews" "{\"target_id\":$FREELANCER_ID,\"rating\":5}" "$CLIENT_TOKEN"

request PATCH "/jobs/$JOB_REVIEW/complete" '{}' "$CLIENT_TOKEN" >/dev/null

record rev job_missing POST /jobs/999999/reviews "{\"target_id\":$FREELANCER_ID,\"rating\":5}" "$CLIENT_TOKEN"
record rev target_missing POST "/jobs/$JOB_REVIEW/reviews" '{"target_id":999999,"rating":5}' "$CLIENT_TOKEN"
record rev wrong_target POST "/jobs/$JOB_REVIEW/reviews" "{\"target_id\":$THIRD_ID,\"rating\":5}" "$CLIENT_TOKEN"

GOOD=$(request POST "/jobs/$JOB_REVIEW/reviews" "{\"target_id\":$FREELANCER_ID,\"rating\":5}" "$CLIENT_TOKEN")
echo "$GOOD" | jq

record rev duplicate POST "/jobs/$JOB_REVIEW/reviews" "{\"target_id\":$FREELANCER_ID,\"rating\":5}" "$CLIENT_TOKEN"

request POST "/jobs/$JOB_REVIEW/reviews" "{\"target_id\":$CLIENT_ID,\"rating\":4}" "$FREELANCER_TOKEN" >/dev/null

record rev forbidden POST "/jobs/$JOB_REVIEW/reviews" "{\"target_id\":$CLIENT_ID,\"rating\":5}" "$THIRD_TOKEN"

record rev get_missing GET /reviews/user/999999
record rev invalid_user GET /reviews/user/abc

echo "OTHER"

record jobs my_postings GET /jobs/my-postings "" "$CLIENT_TOKEN"
record prop my_bids GET /proposals/my-bids "" "$FREELANCER_TOKEN"
record platform stats GET /platform/stats

echo "BUILD ERROR LIST"

jq -s 'map(select(.error!=null))|unique_by(.status,.error)|sort_by(.status,.error)' "$LOG" > "$CAT"

cat "$CAT" | jq

echo "DONE"
echo "$LOG"
echo "$CAT"