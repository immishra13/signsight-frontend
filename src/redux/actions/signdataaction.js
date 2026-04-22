// src/redux/actions/signdataaction.js
import { db, firebase } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  where,
  query,
} from "firebase/compat/firestore"; // <-- compat import NOT needed if you keep db from firebase.js
// NOTE: because we exported `db = firebase.firestore()` from firebase.js (compat),
// we can just use db.collection(...), db.doc(...). To avoid confusion, we'll use compat style below.

import {
  ADD_SIGN_DATA_FAIL,
  ADD_SIGN_DATA_REQ,
  ADD_SIGN_DATA_SUCCESS,
  GET_SIGN_DATA_FAIL,
  GET_SIGN_DATA_REQ,
  GET_SIGN_DATA_SUCCESS,
  GET_TOP_USERS_FAIL,
  GET_TOP_USERS_REQ,
  GET_TOP_USERS_SUCCESS,
} from "../action-types";
import Cookies from "js-cookie";

// -------- helpers ----------
const getLoggedInUserSafe = (state) => {
  try {
    return state?.auth?.user || JSON.parse(Cookies.get("sign-language-ai-user") || "{}");
  } catch {
    return state?.auth?.user || {};
  }
};

// ========= READ: current user's sessions (Firestore) =========
export const getSignData = () => async (dispatch, getState) => {
  try {
    dispatch({ type: GET_SIGN_DATA_REQ });

    const user = getLoggedInUserSafe(getState());
    const userId = user?.userId || user?.uid; // support both

    if (!userId) {
      dispatch({ type: GET_SIGN_DATA_SUCCESS, payload: [] });
      return;
    }

    // Firestore compat style
    const snap = await db
      .collection("SignData")
      .where("userId", "==", userId)
      .get();

    const signData = snap.docs.map((d) => d.data());

    dispatch({ type: GET_SIGN_DATA_SUCCESS, payload: signData });
  } catch (error) {
    dispatch({
      type: GET_SIGN_DATA_FAIL,
      payload: error?.message || "Failed to fetch",
    });
  }
};

// ========= WRITE: save one session (Firestore) =========
export const addSignData = (data) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADD_SIGN_DATA_REQ });

    const user = getLoggedInUserSafe(getState());

    const docId = data.id; // your uuid
    const payload = {
      ...data,
      email: user?.email || null,
      createdAtTs: firebase.firestore.FieldValue.serverTimestamp(), // helpful for sorting
    };

    await db.collection("SignData").doc(docId).set(payload);

    dispatch({ type: ADD_SIGN_DATA_SUCCESS, payload });
    return true; // so UI can show success toast correctly
  } catch (error) {
    dispatch({
      type: ADD_SIGN_DATA_FAIL,
      payload: error?.message || "Write failed",
    });
    throw error; // so UI can show error toast
  }
};

// ========= Leaderboard: top users across all docs (Firestore) =========
export const getTopUsers = () => async (dispatch) => {
  try {
    dispatch({ type: GET_TOP_USERS_REQ });

    const snap = await db.collection("SignData").get();
    const allData = snap.docs.map((d) => d.data());

    // group by username
    const grouped = allData.reduce((acc, cur) => {
      if (!cur?.username) return acc;
      acc[cur.username] = acc[cur.username] || [];
      acc[cur.username].push(cur);
      return acc;
    }, {});

    // Max by total count of signsPerformed
    let uniqueData = Object.values(grouped).map((group) =>
      group.reduce((best, obj) => {
        const sum = (x) => (x?.signsPerformed || []).reduce((s, i) => s + (i.count || 0), 0);
        return sum(obj) > sum(best) ? obj : best;
      })
    );

    uniqueData.sort((a, b) => {
      const sum = (x) => (x?.signsPerformed || []).reduce((s, i) => s + (i.count || 0), 0);
      return sum(b) - sum(a);
    });

    uniqueData = uniqueData.slice(0, 3);
    uniqueData.forEach((o, i) => (o.rank = i + 1));

    const dataForRankBoard = uniqueData.map((o) => ({
      username: o.username,
      rank: o.rank,
    }));

    dispatch({ type: GET_TOP_USERS_SUCCESS, payload: dataForRankBoard });
  } catch (error) {
    dispatch({
      type: GET_TOP_USERS_FAIL,
      payload: error?.message || "Failed to fetch leaderboard",
    });
  }
};
