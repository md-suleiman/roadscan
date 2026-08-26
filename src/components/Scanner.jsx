import { useState, useEffect } from 'react'

import {
  db,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from '../firebase'

function Scanner() {
  const [detecting, setDetecting] =
    useState(false)

  const [count, setCount] =
    useState(0)

  const [status, setStatus] =
    useState(
      'Press Start to begin scanning'
    )

  const [lastDetection, setLastDetection] =
    useState(null)

  const [clicked, setClicked] =
    useState(false)

  const [motionValue, setMotionValue] =
    useState(0)

  const demoSeverities = [
    12,
    12,
    18,
    18,
    18,
    26,
  ]

  const getDistance = (
    lat1,
    lon1,
    lat2,
    lon2
  ) => {
    const R = 6371e3

    const toRad = (deg) =>
      (deg * Math.PI) / 180

    const dLat = toRad(
      lat2 - lat1
    )

    const dLon = toRad(
      lon2 - lon1
    )

    const a =
      Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      )

    return R * c
  }

  const reportPothole = async (
    severity
  ) => {
    setCount((prev) => prev + 1)

    setStatus(
      'Uploading detection...'
    )

    setLastDetection(
      new Date().toLocaleTimeString()
    )

    setClicked(true)

    setTimeout(
      () => setClicked(false),
      200
    )

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat =
          position.coords.latitude

        const lng =
          position.coords.longitude

        const potholesSnapshot =
          await getDocs(
            collection(
              db,
              'potholes'
            )
          )

        let merged = false

        for (const pothole of potholesSnapshot.docs) {
          const data =
            pothole.data()

          const distance =
            getDistance(
              lat,
              lng,
              data.lat,
              data.lng
            )

          if (distance < 15) {
            await updateDoc(
              doc(
                db,
                'potholes',
                pothole.id
              ),
              {
                severity:
                  Math.max(
                    severity,
                    data.severity ||
                      0
                  ),

                reportCount:
                  (data.reportCount ||
                    1) + 1,

                lastReported:
                  new Date().toISOString(),
              }
            )

            merged = true

            break
          }
        }

        if (!merged) {
          await addDoc(
            collection(
              db,
              'potholes'
            ),
            {
              lat,
              lng,

              severity,

              reportCount: 1,

              timestamp:
                new Date().toISOString(),
            }
          )
        }

        let label = 'Minor'

        if (severity > 22)
          label = 'Severe'
        else if (severity > 15)
          label = 'Moderate'

        setStatus(
          merged
            ? `${label} pothole merged`
            : `${label} pothole detected`
        )
      },

      () =>
        setStatus(
          'Location permission denied'
        )
    )
  }

  useEffect(() => {
    let wakeLock = null

    const enableWakeLock =
      async () => {
        try {
          if (
            'wakeLock' in navigator
          ) {
            wakeLock =
              await navigator.wakeLock.request(
                'screen'
              )
          }
        } catch (err) {
          console.log(err)
        }
      }

    if (detecting) {
      enableWakeLock()
    }

    return () => {
      if (
        wakeLock &&
        wakeLock.release
      ) {
        wakeLock.release()
      }
    }
  }, [detecting])

  // =========================
  // MOTION DETECTION
  // =========================

  useEffect(() => {
    let lastTrigger = 0
    let lastZ = null

    const recentDeltas = []

    let impactActive = false
    let impactPeak = 0
    let impactStart = 0

    const isWalkingPattern = () => {
      const now = Date.now()

      const spikes =
        recentDeltas.filter(
          (d) =>
            now - d.time < 4000 &&
            d.value > 4
        )

      if (spikes.length < 4)
        return false

      const intervals = []

      for (
        let i = 1;
        i < spikes.length;
        i++
      ) {
        intervals.push(
          spikes[i].time -
            spikes[i - 1].time
        )
      }

      const avg =
        intervals.reduce(
          (a, b) => a + b,
          0
        ) / intervals.length

      const isRhythmic =
        intervals.every(
          (i) =>
            Math.abs(i - avg) <
            220
        )

      return (
        isRhythmic &&
        avg > 350 &&
        avg < 900
      )
    }

    const isSpeedbreaker = () => {
      const last4 =
        recentDeltas.slice(-4)

      if (last4.length < 4)
        return false

      return last4.every(
        (d) => d.value > 5
      )
    }

    const classifySeverity = (
      peak
    ) => {
      if (peak >= 22) {
        return 26
      }

      if (peak >= 14) {
        return 19
      }

      return 12
    }

    const finishImpact = () => {
      if (!impactActive)
        return

      impactActive = false

      const peak = impactPeak

      impactPeak = 0
      impactStart = 0

      const now = Date.now()

      if (
        now - lastTrigger <
        1500
      ) {
        return
      }

      if (isWalkingPattern()) {
        setStatus(
          'Walking detected — ignored'
        )

        return
      }

      if (isSpeedbreaker()) {
        setStatus(
          'Speedbreaker detected — ignored'
        )

        return
      }

      // Ignore tiny movements
      if (peak < 8) {
        return
      }

      lastTrigger = now

      const severity =
        classifySeverity(peak)

      reportPothole(severity)
    }

    const handleMotion = (
      event
    ) => {
      const currentZ =
        event
          .accelerationIncludingGravity
          ?.z || 0

      if (lastZ === null) {
        lastZ = currentZ
        return
      }

      const delta = Math.abs(
        currentZ - lastZ
      )

      lastZ = currentZ

      recentDeltas.push({
        value: delta,
        time: Date.now(),
      })

      if (
        recentDeltas.length > 20
      ) {
        recentDeltas.shift()
      }

      setMotionValue(
        delta.toFixed(2)
      )

      // Start measuring an impact
      if (
        delta >= 8 &&
        !impactActive
      ) {
        impactActive = true
        impactStart = Date.now()
        impactPeak = delta
      }

      // Keep measuring the impact
      // for a short window
      if (impactActive) {
        impactPeak = Math.max(
          impactPeak,
          delta
        )

        if (
          Date.now() -
            impactStart >=
          350
        ) {
          finishImpact()
        }
      }
    }

    if (detecting) {
      if (
        typeof DeviceMotionEvent !==
          'undefined' &&
        typeof DeviceMotionEvent.requestPermission ===
          'function'
      ) {
        DeviceMotionEvent
          .requestPermission()
          .then((permission) => {
            if (
              permission ===
              'granted'
            ) {
              window.addEventListener(
                'devicemotion',
                handleMotion
              )

              setStatus(
                'Motion detection active'
              )
            }
          })
      } else {
        window.addEventListener(
          'devicemotion',
          handleMotion
        )

        setStatus(
          'Motion detection active'
        )
      }
    }

    return () => {
      window.removeEventListener(
        'devicemotion',
        handleMotion
      )
    }
  }, [detecting])

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '2rem',
        maxWidth: '500px',
        margin: '0 auto',
      }}
    >
      <h2
        style={{
          fontSize: '2.5rem',
          marginBottom: '0.5rem',
          color: 'white',
        }}
      >
        RoadScan
      </h2>

      <p
        style={{
          color: '#94a3b8',
          marginBottom: '2rem',
          fontSize: '1.1rem',
        }}
      >
        AI Pothole Detection System
      </p>

      <div
        style={{
          background:
            'rgba(255,255,255,0.08)',
          padding: '1.5rem',
          borderRadius: '24px',
          marginBottom: '2rem',
          border:
            '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <p
          style={{
            fontSize: '1.1rem',
            margin: 0,
            color: 'white',
            fontWeight: '600',
          }}
        >
          {status}
        </p>

        {lastDetection && (
          <p
            style={{
              fontSize: '0.95rem',
              color: '#cbd5e1',
              marginTop: '0.8rem',
            }}
          >
            Last detected at{' '}
            {lastDetection}
          </p>
        )}
      </div>

      <div
        style={{
          marginBottom: '2rem',
        }}
      >
        <p
          style={{
            fontSize: '4rem',
            fontWeight: 'bold',
            margin: 0,
            color: '#38bdf8',
          }}
        >
          {count}
        </p>

        <p
          style={{
            color: '#94a3b8',
            margin: 0,
            fontSize: '1rem',
          }}
        >
          Potholes Detected
        </p>

        <p
          style={{
            color: '#38bdf8',
            marginTop: '1rem',
            fontSize: '1rem',
          }}
        >
          Motion Value:{' '}
          {motionValue}
        </p>
      </div>

      <button
        onClick={() =>
          setDetecting(
            !detecting
          )
        }
        style={{
          padding:
            '1rem 2rem',
          fontSize: '1rem',
          backgroundColor:
            detecting
              ? '#ef4444'
              : '#22c55e',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          width: '100%',
          marginBottom: '1rem',
          fontWeight: '700',
        }}
      >
        {detecting
          ? 'Stop Scanning'
          : 'Start Scanning'}
      </button>

      <button
        onClick={() => {
          const randomSeverity =
            demoSeverities[
              Math.floor(
                Math.random() *
                  demoSeverities.length
              )
            ]

          reportPothole(
            randomSeverity
          )
        }}
        style={{
          padding:
            '1rem 2rem',
          fontSize: '1rem',
          backgroundColor:
            clicked
              ? '#1d4ed8'
              : '#2563eb',
          transform: clicked
            ? 'scale(0.96)'
            : 'scale(1)',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          width: '100%',
          transition:
            'all 0.15s ease',
          boxShadow:
            '0 10px 30px rgba(37,99,235,0.35)',
          fontWeight: '700',
        }}
      >
        Simulate Detection
      </button>
    </div>
  )
}

export default Scanner