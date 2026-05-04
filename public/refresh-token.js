  export async function renewAccessTokenAndRefreshToken(){
    try {
      const response = await fetch('/api/auth/refresh-token', {method: 'POST', credentials: "include"});
  
      if(response.ok){
        const data = await response.json();
        // console.log(data.data)
        return data.data;
      }
      else{
        // window.location.href = "/oidc/oauth2/authenticate";
      }
    }
    catch (err) {
      console.error(err.message);
    }
  }