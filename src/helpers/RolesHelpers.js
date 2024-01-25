import ArrayHelpers from './ArrayHelpers'
import { f7 } from 'framework7-react'

const hasRolesAuth = data => {
  let newHasRoles = []
  if (data && data?.groups) {
    newHasRoles = data.groups.map(x => ({
      ...x,
      name: x.group + f7.utils.id("xxxx-xxxx-xxxx-xxxx"),
      children: x.rights
        ? x.rights.map(r => ({
            ...r,
            name: r.name, // + useId()
            children: r?.subs || null
          }))
        : []
    }))
  }
  return { hasRoles: newHasRoles }
}

const getHasRole = (Roles, CrStocks) => {
  let hasRight = Roles?.hasRight || false
  let StockRoles = Roles?.stocksList
    ? Roles?.stocksList.map(x => ({ ...x, label: x.Title, value: x.ID }))
    : []

  if (hasRight && !Roles.IsAllStock) {
    hasRight = StockRoles.some(x => x.ID === CrStocks.ID)
  }
  return {
    hasRight,
    StockRoles,
    StockRolesAll: Roles?.IsAllStock
      ? [{ label: 'Hệ thống', value: 0 }, ...StockRoles]
      : StockRoles,
    IsStocks: Roles?.IsAllStock || false
  }
}

const useRoles = ({
  nameRoles,
  auth,
  CrStocks
}) => {
  const isMultiple = Array.isArray(nameRoles)
  let result = {}
  
  const { hasRoles } = hasRolesAuth(auth?.Info?.rightTree)
  if (!isMultiple) {
    const hasRolesItem = ArrayHelpers.findNodeByName(hasRoles, nameRoles)
    if (hasRolesItem) {
      result[nameRoles] = { ...getHasRole(hasRolesItem, CrStocks) }
    } else {
      result[nameRoles] = { hasRight: false, StockRoles: [] }
    }
  } else {
    for (let key of nameRoles) {
      const hasRolesItem = ArrayHelpers.findNodeByName(hasRoles, key)
      if (hasRolesItem) {
        result[key] = { ...getHasRole(hasRolesItem, CrStocks) }
      } else {
        result[key] = {
          hasRight: false,
          StockRoles: []
        }
      }
    }
  }
  return result
}

export const RolesHelpers = {
  useRoles
}
