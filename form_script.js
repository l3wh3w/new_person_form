/**
 * form_validator.js
 *
 * Genel form doğrulama, gönderme ve alan başlatma işlemleri için birleştirilmiş script.
 * - Gelişmiş telefon numarası formatlama ve doğrulaması (intl-tel-input & libphonenumber).
 * - Tarih alanı formatlaması.
 * - AJAX ile form gönderme ve sonuçları işleme.
 *
 * Kullanım:
 * FormValidator.initPersonnelForm({ ...config... });
 */

const FormValidator = (() => {
  // CSRF token'ı almak için yardımcı fonksiyon
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  // Başarı/hata mesajlarını göstermek için genel uyarı fonksiyonu
  function showAlert(type, message, containerId) {
    const alertContainer = $(`#${containerId}`);
    if (!alertContainer.length) {
      console.warn(`Alert container with id #${containerId} not found.`);
      // Fallback
      alert(message);
      return;
    }

    const alertClass = type === "success" ? "alert-success" : "alert-danger";
    const iconClass =
      type === "success" ? "fa-check-circle" : "fa-times-circle";
    const title = type === "success" ? "Başarılı!" : "Hata!";

    const alertHtml = `
      <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
        <i class="fa ${iconClass} me-2"></i>
        <strong>${title}</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;

    alertContainer.html(alertHtml); // Önceki uyarıları temizle ve yenisini ekle

    // 5 saniye sonra otomatik gizle
    setTimeout(() => {
      alertContainer.find(".alert").fadeOut(500, function () {
        $(this).remove();
      });
    }, 5000);
  }

  // Sunucudan gelen form hatalarını işleyen fonksiyon
  function handleFormErrors(form, response, alertContainerId) {
    // Önceki tüm 'is-invalid' sınıflarını temizle
    $(form).find(".is-invalid").removeClass("is-invalid");

    // <-- GÜNCELLENDİ: Sunucudan gelen genel mesajı (varsa) göster.
    // Eğer özel bir mesaj yoksa, genel bir uyarı göster.
    const mainErrorMessage =
      response.message || "Lütfen formdaki hataları düzeltin.";
    showAlert("danger", mainErrorMessage, alertContainerId);

    if (response.errors) {
      $.each(response.errors, function (field, errors) {
        const fieldElement = $(form).find(`[name="${field}"]`);
        if (fieldElement.length) {
          fieldElement.addClass("is-invalid");
          // .invalid-feedback elementini bul ve metni ayarla
          let feedback = fieldElement.siblings(".invalid-feedback");
          if (!feedback.length) {
            feedback = $(`<div class="invalid-feedback"></div>`);
            fieldElement.after(feedback);
          }
          feedback.text(errors[0]);
        }
      });
    }
  }

  // Tarih alanını (DD.MM.YYYY) formatlamak için fonksiyon
  function initializeDateInput(selector) {
    const dateInput = document.querySelector(selector);
    if (dateInput) {
      const formatAndValidate = (e) => {
        let value = e.target.value.replace(/\D/g, ""); // Sadece rakamlar
        let formattedValue = "";

        if (value.length > 0) {
          formattedValue = value.substring(0, 2);
          if (value.length > 2) {
            formattedValue += "." + value.substring(2, 4);
          }
          if (value.length > 4) {
            formattedValue += "." + value.substring(4, 8);
          }
        }
        e.target.value = formattedValue;
      };
      dateInput.addEventListener("input", formatAndValidate);
    } else {
      console.warn(`Date input not found with selector: ${selector}`);
    }
  }
  /**
   * Gelişmiş telefon alanı formatlama ve doğrulama. (Tüm ülkeler için ana hat önekini kaldıracak şekilde güncellendi)
   */
  function initializePhoneInput(selector) {
    const phoneInput = document.querySelector(selector);
    if (!phoneInput) {
      console.warn(`Phone input not found with selector: ${selector}`);
      return;
    }

    const iti = window.intlTelInput(phoneInput, {
      initialCountry: "tr",
      preferredCountries: ["tr", "az"],
      geoIpLookup: true,
      separateDialCode: true,
      utilsScript:
        "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js",
      loadUtils: true,
    });

    phoneInput.iti = iti;

    const setFormattedValueKeepCursor = (formatted, oldValue, oldPos) => {
      const oldDigitsBeforeCursor = oldValue
        .slice(0, oldPos)
        .replace(/\D/g, "").length;
      phoneInput.value = formatted;
      let digitCount = 0;
      let newPos = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          digitCount++;
          if (digitCount === oldDigitsBeforeCursor) {
            newPos = i + 1;
            break;
          }
        }
      }
      if (newPos === 0) newPos = formatted.length;
      setTimeout(() => phoneInput.setSelectionRange(newPos, newPos), 0);
    };

    const validateNumber = () => {
      const oldValue = phoneInput.value;
      const oldPos = phoneInput.selectionStart;

      let finalFormattedValue = oldValue; // Varsayılan değer

      try {
        const fullNumber = iti.getNumber();
        if (fullNumber && iti.isValidNumber()) {
          // 1. Numarayı ayrıştırarak 'PhoneNumber' nesnesini alalım.
          const parsedNumber = libphonenumber.parsePhoneNumber(fullNumber);

          // 2. Kütüphaneden iki farklı formatı alalım.
          const formattedForDialing = parsedNumber.format("NATIONAL"); // Örn: "0555 123 45 67"
          const significantDigits = parsedNumber.nationalNumber; // Örn: "5551234567"

          // 3. Bu iki formattaki rakamları karşılaştırarak ana hat önekini (trunk prefix) bulalım.
          const allDigitsInDialingFormat = formattedForDialing.replace(
            /\D/g,
            ""
          );
          let trunkPrefix = "";
          if (allDigitsInDialingFormat.startsWith(significantDigits)) {
            // Bu durum genellikle İtalya gibi öneki olmayan ülkeler için geçerlidir.
            trunkPrefix = "";
          } else {
            trunkPrefix = allDigitsInDialingFormat.substring(
              0,
              allDigitsInDialingFormat.length - significantDigits.length
            );
          }

          // 4. Bulduğumuz öneki, ulusal formatın başından silelim (eğer varsa).
          if (trunkPrefix) {
            finalFormattedValue = formattedForDialing.replace(
              new RegExp("^" + trunkPrefix + "\\s*"),
              ""
            );
          } else {
            finalFormattedValue = formattedForDialing;
          }
        } else {
          // Numara geçerli değilse, eski "yazarken formatla" yöntemini kullanalım.
          const digitsOnly = oldValue.replace(/\D/g, "");
          const countryCode = iti.getSelectedCountryData().iso2.toUpperCase();
          const formatter = new libphonenumber.AsYouType(countryCode);
          finalFormattedValue = formatter.input(digitsOnly);
        }

        setFormattedValueKeepCursor(finalFormattedValue, oldValue, oldPos);
      } catch (e) {
        // Bir hata olursa, en azından basit formatlamayı dene.
        const digitsOnly = oldValue.replace(/\D/g, "");
        setFormattedValueKeepCursor(digitsOnly, oldValue, oldPos);
      }

      // Doğrulama sınıflarını (is-valid/is-invalid) ayarla
      try {
        if (iti.isValidNumber()) {
          phoneInput.classList.remove("is-invalid");
          phoneInput.classList.add("is-valid");
        } else {
          phoneInput.classList.remove("is-valid");
        }
      } catch (e) {
        phoneInput.classList.remove("is-valid");
        phoneInput.classList.remove("is-invalid");
      }
    };

    phoneInput.addEventListener("countrychange", () => {
      phoneInput.value = "";
      phoneInput.focus();

      validateNumber();
    });

    // Yazarken formatlama ve validasyon
    phoneInput.addEventListener("input", () => {
      validateNumber();
    });

    phoneInput.addEventListener("blur", validateNumber);

    // Ülke değişikliği
    phoneInput.addEventListener("countrychange", () => {
      validateNumber();
    });

    // Sadece rakam girişi sağla ve maksimum kontrol
    phoneInput.addEventListener("keypress", (e) => {
      // Sadece rakam, navigasyon tuşları ve kontrol tuşlarına izin ver
      if (
        !/\d/.test(e.key) &&
        !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(
          e.key
        )
      ) {
        e.preventDefault();
        return;
      }
    });

    // Yapıştırma kontrolü

    phoneInput.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData)
        .getData("text")
        .trim();

      // intl-tel-input'a ver
      iti.setNumber(pasted);

      const e164 = iti.getNumber(intlTelInputUtils.numberFormat.E164);
      const countryCode = iti.getSelectedCountryData().dialCode;
      let localNumber = "";

      if (e164 && iti.isValidNumber()) {
        // ✅ Geçerli numara: ülke kodunu çıkar
        localNumber = e164.replace("+" + countryCode, "");
      } else {
        // ❌ Geçersiz numara: sadece rakamları al
        localNumber = pasted.replace(/\D/g, "");
      }

      phoneInput.value = localNumber;

      validateNumber();
    });

    // `utils.js` yüklendiğinde çalışacak olan kod.

    iti.promise
      .then(validateNumber)
      .catch((err) => console.error("utils.js yüklenirken hata:", err));
  }

  /**
   * Form gönderme işlemini (AJAX dahil) yöneten ana fonksiyon.
   */
  function setupFormSubmission(formSelector, config) {
    $(formSelector).on("submit", function (e) {
      e.preventDefault();
      const form = this;
      const submitBtn = $(form).find('button[type="submit"]');

      // 🔥 ESKİ HATALARI TEMİZLE
      $(form).find(".is-invalid").removeClass("is-invalid");
      $(form).find(".invalid-feedback").remove();
      $(`#${config.alertContainerId}`).html(""); // <-- YENİ: Genel uyarı kutusunu temizle

      // ... (Telefon numarası doğrulama kodunuz burada aynı kalıyor) ...

      const originalBtnText = submitBtn.html();
      submitBtn
        .prop("disabled", true)
        .html(
          '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Gönderiliyor...'
        );

      const resetLoading = () => {
        submitBtn.prop("disabled", false).html(originalBtnText);
      };

      const formData = $(form).serialize();
      $.ajax({
        url: config.url || window.location.href,
        type: "POST",
        data: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRFToken": getCookie("csrftoken"), // Django CSRF token
        },
        success: function (response) {
          if (response.success) {
            showAlert(
              "success",
              response.message || "İşlem başarıyla tamamlandı!",
              config.alertContainerId
            );
            if (config.resetFormOnSuccess !== false) {
              // Form sıfırlamayı opsiyonel yap
              form.reset();
            }
            if (config.onSuccess) {
              // Başarı durumunda özel bir fonksiyon çalıştırma
              config.onSuccess(response);
            }
          } else {
            // Güncellenmiş handleFormErrors fonksiyonu çağrılacak
            handleFormErrors(form, response, config.alertContainerId);
          }
        },
        error: function (xhr) {
          const defaultError =
            "Bir sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.";
          try {
            const response = xhr.responseJSON;
            // Sunucudan 4xx veya 5xx koduyla birlikte JSON hatası gelirse
            if (response) {
              handleFormErrors(form, response, config.alertContainerId);
            } else {
              showAlert("danger", defaultError, config.alertContainerId);
            }
          } catch (e) {
            showAlert("danger", defaultError, config.alertContainerId);
          }
        },
        complete: resetLoading,
      });
    });
  }

  /**
   * Ana başlatıcı fonksiyon. HTML sayfasından bu çağrılır.
   */
  function initPersonnelForm(config) {
    $(document).ready(function () {
      if (!config.formId || !config.alertContainerId) {
        console.error(
          "FormValidator.initPersonnelForm requires 'formId' and 'alertContainerId' in config."
        );
        return;
      }

      console.log(`FormValidator initialized for: #${config.formId}`);

      // Alanları başlat
      if (config.phoneField) {
        initializePhoneInput(config.phoneField);
      }
      if (config.dateField) {
        initializeDateInput(config.dateField);
      }

      // Form gönderimini ayarla
      setupFormSubmission(`#${config.formId}`, config);
    });
  }

  // Dışarıya açılacak public fonksiyonlar
  return {
    initPersonnelForm: initPersonnelForm,
    showAlert: showAlert, // Harici olarak da kullanılabilir yapmak için
  };
})();
