package com.shifttracker // Note the new package name

import android.os.Bundle // <-- ADD THIS IMPORT
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "ShiftTracker"

  // --- ADD THIS ENTIRE FUNCTION ---
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }
  // ---------------------------------

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}