/**
 * 圖片資源管理
 * 統一管理所有圖片資源，確保打包時有雜湊值
 */

// 主要背景圖片
import backgroundImg from '../../images/background.png'
import posterImg from '../../images/poster.png'
import ogPhotoImg from '../../images/og_photo.png'
import entered1Img from '../../images/Entered1.png'

// Award Speech 相關圖片
import awardSpeechImg from '../../images/award_speech.png'
import awardBackgroundImg from '../../images/award_background.png'
import awardFilteredImg from '../../images/award_filtered.png'
import awardFilteredWithTextImg from '../../images/award_filteredwithtext.png'
import award2025Img from '../../images/award_2025.png'
import awardButtonImg from '../../images/award_button.png'
import awardLogoImg from '../../images/award_logo.png'
import awardTitleImg from '../../images/award_Title.png'

// 圖片映射表
export const images = {
  // 主要圖片
  background: backgroundImg,
  poster: posterImg,
  ogPhoto: ogPhotoImg,
  entered1: entered1Img,
  
  // Award Speech 圖片
  awardSpeech: awardSpeechImg,
  awardBackground: awardBackgroundImg,
  awardFiltered: awardFilteredImg,
  awardFilteredWithText: awardFilteredWithTextImg,
  award2025: award2025Img,
  awardButton: awardButtonImg,
  awardLogo: awardLogoImg,
  awardTitle: awardTitleImg
}

// 主題相關圖片函數
export const getThemeImages = (eventType) => {
  if (eventType === 'award_speech') {
    return {
      background: images.awardSpeech,
      detailBackground: images.awardBackground,
      poster: images.awardFiltered,
      posterWithText: images.awardFilteredWithText,
      logo: images.awardLogo,
      title: images.awardTitle,
      button: images.awardButton,
      hero: images.award2025
    }
  } else {
    return {
      background: images.background,
      detailBackground: images.poster,
      poster: images.poster,
      posterWithText: images.poster,
      entered1: images.entered1
    }
  }
}

// 預設匯出
export default images
